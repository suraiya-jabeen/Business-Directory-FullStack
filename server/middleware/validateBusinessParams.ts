import { RequestHandler } from 'express';
import mongoose from 'mongoose';

export const validateBusinessParams: RequestHandler = (req, res, next) => {
   // Validate ID first
   if (req.params.id && !mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid business ID format' });
  }
  // Skip validation for GET /api/business (listing without ID)
  if (req.method === 'GET' && !req.params.id) return next();

  // Validate sortBy parameter
  const validSortFields = [
    'businessName', 'revenue', 'cagr', 
    'profitMargin', 'roi', 'customerRetention'
  ];
  
  if (req.query.sortBy && !validSortFields.includes(req.query.sortBy as string)) {
    return res.status(400).json({ error: 'Invalid sort parameter' });
  }

  // Validate numeric parameters
  const numericParams = [
    'page', 'limit', 'minRevenue', 
    'minCagr', 'minProfitMargin', 'minRoi', 
    'minCustomerRetention'
  ];

  for (const param of numericParams) {
    const value = req.query[param];
    if (value && isNaN(Number(value))) {
      return res.status(400).json({ error: `Invalid numeric value for ${param}` });
    }
  }

  // Additional validation for routes with ID
  if (req.params.id && !mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid business ID format' });
  }

  next();
};
