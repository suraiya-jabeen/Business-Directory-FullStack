// server/routes/message.ts
import express from 'express';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { auth } from '../middleware/auth';
import { messageAuthorization } from '../middleware/messageAuth';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import User from '../models/User';

// Type extensions for Express Request
declare global {
  namespace Express {
    interface Request {
      user: {
        _id: string;
        email: string;
        role: string;
      } | undefined;
      conversation?: mongoose.Document & {
        _id: mongoose.Types.ObjectId;
        participants: mongoose.Types.ObjectId[];
      };
    }
  }
}

const router = express.Router();

export default function messageRoutes(io: Server) {
  // Send a new message
  router.post('/send', auth, async (req, res) => {
    try {
      const { receiverId, content } = req.body;
      const senderId = req.user!._id;

      // Validate input
      if (!mongoose.Types.ObjectId.isValid(receiverId)) {
        return res.status(400).json({ error: 'Invalid receiver ID' });
      }

      if (!content?.trim()) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      // Verify receiver exists and is not the sender
      const receiver = await User.findById(receiverId) as mongoose.Document & { 
        _id: mongoose.Types.ObjectId; 
        role: string; 
      };
      if (!receiver || receiver._id.equals(senderId)) {
        return res.status(404).json({ error: 'Invalid recipient' });
      }

      // Business-specific validation
      if (req.user!.role === 'business' && receiver.role !== 'user') {
        return res.status(403).json({ 
          error: 'Businesses can only message individual users' 
        });
      }

      // Create conversation or find existing one
      let conversation = await Conversation.findOneAndUpdate(
        { participants: { $all: [senderId, receiverId], $size: 2 } },
        { $setOnInsert: { participants: [senderId, receiverId] } },
        { new: true, upsert: true }
      );

      // Create and save message
      const message = new Message({
        conversation: conversation._id,
        sender: senderId,
        receiver: receiverId,
        content: content.trim()
      });
      await message.save();

      // Update conversation last activity
      conversation.lastActive = new Date();
      await conversation.save();

      // Populate sender info for the socket event
      const populatedMessage = await Message.populate(message, {
        path: 'sender',
        select: '_id email role businessName profileImage'
      });

      // Emit real-time update
      io.to(receiverId.toString()).emit('newMessage', {
        conversationId: conversation._id,
        message: populatedMessage
      });

      res.status(201).json(populatedMessage);
    } catch (error) {
      console.error('Message send error:', error);
      res.status(500).json({ 
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Search users for messaging
  router.get('/search/users', auth, async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string' || query.length < 2) {
        return res.status(400).json({ error: 'Search query must be at least 2 characters' });
      }

      const users = await User.find({
        $or: [
          { email: { $regex: query, $options: 'i' } },
          { businessName: { $regex: query, $options: 'i' } }
        ],
        _id: { $ne: req.user!._id } // Exclude current user
      })
      .limit(10)
      .select('_id email role businessName profileImage');

      res.json(users);
    } catch (error) {
      console.error('Search failed:', error);
      res.status(500).json({ 
        error: 'Failed to search users',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get user's conversations with unread count
  router.get('/', auth, async (req, res) => {
    try {
      const conversations = await Conversation.aggregate([
        { $match: { participants: req.user!._id } },
        {
          $lookup: {
            from: 'messages',
            let: { conversationId: '$_id' },
            pipeline: [
              { 
                $match: { 
                  $expr: { $eq: ['$conversation', '$$conversationId'] },
                  receiver: req.user!._id,
                  read: false
                }
              },
              { $count: 'unreadCount' }
            ],
            as: 'unread'
          }
        },
        {
          $addFields: {
            unreadCount: { $ifNull: [{ $arrayElemAt: ['$unread.unreadCount', 0] }, 0] }
          }
        },
        { $sort: { lastActive: -1 } }
      ]);

      // Populate participants
      const populatedConversations = await Conversation.populate(conversations, {
        path: 'participants',
        select: '_id email role businessName profileImage'
      });

      res.json(populatedConversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      res.status(500).json({ 
        error: 'Failed to fetch conversations',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get messages for a specific conversation
  router.get('/:conversationId/messages', auth, messageAuthorization, async (req, res) => {
    try {
      const messages = await Message.find({
        conversation: req.params.conversationId
      })
      .sort({ createdAt: 1 })
      .populate('sender', '_id email role businessName profileImage');

      res.json(messages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      res.status(500).json({ 
        error: 'Failed to fetch messages',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Mark messages as read
  router.patch('/:conversationId/read', auth, messageAuthorization, async (req, res) => {
    try {
      const result = await Message.updateMany(
        { 
          conversation: req.params.conversationId,
          receiver: req.user!._id,
          read: false
        },
        { $set: { read: true } }
      );

      // Notify sender that messages were read
      if (req.conversation) {
        const otherParticipant = req.conversation.participants.find(
          p => !p.equals(req.user!._id)
        );
        if (otherParticipant) {
          io.to(otherParticipant.toString()).emit('messagesRead', {
            conversationId: req.params.conversationId,
            readerId: req.user!._id
          });
        }
      }

      res.json({ 
        success: true,
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      res.status(500).json({ 
        error: 'Failed to mark messages as read',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}