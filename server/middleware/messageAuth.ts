// server/middleware/messageAuth.ts
import { NextFunction, Request, Response } from 'express';
import Message from '../models/Message';
import User from '../models/User';

export const messageAuthorization = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get conversation with populated participant roles
    const conversation = await Message.findById(req.params.id)
      .populate({
        path: 'conversation', // Assuming 'conversation' is the correct field
        populate: {
          path: 'participants',
          select: 'role',
          model: User
        }
      }) as unknown as {
        participants: { _id: string; role: string }[];
      };

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Authorization check: user must be a participant
    const isParticipant = conversation.participants.some((p: any) => 
      p._id.equals(req.user?._id)
    );
    if (!isParticipant) {
      return res.status(403).json({ error: "Not authorized to access this conversation" });
    }
    // Interaction type validation
    const roles = conversation?.participants?.map((p: any) => p.role) || [];
    const validInteractionTypes = [
      ['user', 'user'],
      ['user', 'business'], 
      ['business', 'business']
    ];
    
    const normalizedRoles = roles.sort().toString();
    const isValid = validInteractionTypes.some(types => 
      types.sort().toString() === normalizedRoles
    );

    if (!isValid) {
      return res.status(403).json({ 
        error: "Unauthorized conversation type between these roles" 
      });
    }

    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};
