// models/User.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose, { Document, Model, Schema } from 'mongoose';
import validator from 'validator';

// Type definitions
export interface IUser extends Document {
  email: string;
  password: string;
  role: 'user' | 'business' | 'admin';
  businessName?: string;
  profileImage?: string;
  contact?: {
    phone?: string;
    address?: string;
  };
  tokens: Array<{ token: string }>;
  isActive: boolean;
  lastLogin?: Date;
  generateAuthToken(): Promise<string>;
  revokeToken(token: string): Promise<void>;
  revokeAllTokens(): Promise<void>;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

interface IUserModel extends Model<IUser> {
  findByCredentials(email: string, password: string): Promise<IUser>;
  findByToken(token: string): Promise<IUser | null>;
}

const userSchema = new Schema<IUser, IUserModel>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value: string) => validator.isEmail(value),
        message: 'Please provide a valid email address'
      }
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
      validate: {
        validator: function(this: IUser, value: string) {
          // Skip validation if password is already hashed
          if (value.startsWith('$2a$') || value.startsWith('$2b$')) {
            return true;
          }
          // Only validate when password is modified
          if (this.isModified('password')) {
            return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
          }
          return true;
        },
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
      }
    },
    role: {
      type: String,
      enum: ['user', 'business', 'admin'],
      default: 'user'
    },
    businessName: {
      type: String,
      required: function(this: IUser) {
        return this.role === 'business';
      },
      trim: true,
      maxlength: [100, 'Business name cannot be longer than 100 characters']
    },
    profileImage: {
      type: String,
      validate: {
        validator: (value: string) => validator.isURL(value, {
          protocols: ['http', 'https'],
          require_protocol: true
        }),
        message: 'Profile image must be a valid URL'
      }
    },
    contact: {
      phone: {
        type: String,
        validate: {
          validator: (value: string) => validator.isMobilePhone(value),
          message: 'Please provide a valid phone number'
        }
      },
      address: {
        type: String,
        maxlength: [200, 'Address cannot be longer than 200 characters']
      }
    },
    tokens: [{
      token: {
        type: String,
        required: true
      }
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.password;
        delete ret.tokens;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.password;
        delete ret.tokens;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Password hashing middleware
userSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as mongoose.CallbackError);
  }
});

// Instance methods
userSchema.methods.matchPassword = async function(enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};


userSchema.methods.generateAuthToken = async function(): Promise<string> {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  const token = jwt.sign(
    {
      id: this._id,
      role: this.role,
      email: this.email
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE ? parseInt(process.env.JWT_EXPIRE, 10) : '1d' }
  );

  this.tokens = this.tokens.concat({ token });
  this.lastLogin = new Date();
  await this.save();
  return token;
};

userSchema.methods.revokeToken = async function(token: string): Promise<void> {
  this.tokens = this.tokens.filter((t: { token: string }) => t.token !== token);
  await this.save();
};

userSchema.methods.revokeAllTokens = async function(): Promise<void> {
  this.tokens = [];
  await this.save();
};

// Static methods
userSchema.statics.findByCredentials = async function(
  email: string, 
  password: string
): Promise<IUser> {
  const user = await this.findOne({ email, isActive: true })
    .select('+password +tokens +role');
  
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return user;
};

userSchema.statics.findByToken = async function(token: string): Promise<IUser | null> {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as jwt.JwtPayload;
    return await this.findOne({ 
      _id: decoded.id,
      'tokens.token': token,
      isActive: true
    });
  } catch (error) {
    return null;
  }
};

// Indexes - Remove duplicate index definitions
//userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ 'tokens.token': 1 });
userSchema.index({ role: 1 });
userSchema.index({ businessName: 'text' }, {
  weights: {
    businessName: 10
  },
  name: 'businessNameTextIndex'
});

// Virtuals
userSchema.virtual('profile').get(function() {
  return {
    email: this.email,
    role: this.role,
    businessName: this.businessName,
    profileImage: this.profileImage,
    contact: this.contact
  };
});

const User: IUserModel = mongoose.models.User as IUserModel || mongoose.model<IUser, IUserModel>('User', userSchema);
export { IUser as UserDocument, IUserModel as UserModel };
export default User;