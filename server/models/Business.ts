import mongoose from 'mongoose';
//import type UserDocument from './User'; // Import UserDocument as a type
import User, { UserDocument } from './User';

// Define Business-specific schema fields
const businessSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  businessType: {
    type: String,
    required: true,
    enum: ['Private', 'Corporation', 'Partnership', 'LLC', 'Non-Profit']
  },
  industry: {
    type: String,
    required: true,
    enum: ["Technology", "Retail", "Healthcare", "Manufacturing", "Finance", "Hospitality"]
  },
  financialData: {
    revenue: [{
      year: Number,
      amount: Number,
      currency: {
        type: String,
        default: 'USD'
      }
    }],
    cagr: {
      type: Number,
      min: 0,
      max: 100
    },
    profitMargin: {
      type: Number,
      min: 0,
      max: 100
    },
    roi: Number,
    customerRetention: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  productsServices: [{
    name: String,
    description: String,
    price: Number,
    available: {
      type: Boolean,
      default: true
    }
  }],
  role: {
    type: String,
    default: 'business',
    enum: ['business'],
    immutable: true
  }
});

// Extend UserDocument with Business-specific fields and methods
export interface BusinessDocument extends UserDocument {
  businessName: string;
  businessType: string;
  industry: string;
  financialData?: {
    revenue?: Array<{ year: number; amount: number; currency: string }>;
    cagr?: number;
    profitMargin?: number;
    roi?: number;
    customerRetention?: number;
  };
  productsServices?: Array<{
    name: string;
    description?: string;
    price?: number;
    available?: boolean;
  }>;
}

// Create discriminator model with proper typing
const Business = User.discriminator<BusinessDocument>(
  'Business',
  businessSchema
);

export default Business;