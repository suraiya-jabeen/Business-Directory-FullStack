import express from 'express';
import mongoose from 'mongoose';
import authMiddleware from '../middleware/auth';
import Business from '../models/Business';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all businesses
router.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      sortBy = 'businessName',
      search,
      type,
      industry,
      minRevenue,
      minCagr,
      minProfitMargin,
      minRoi,
      minCustomerRetention,
      location
    } = req.query;

    // Validate and parse numeric parameters
    const pageNumber = Math.max(1, parseInt(page as string, 10)) || 1;
    const limitNumber = Math.max(1, parseInt(limit as string, 10)) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter object
    const filter: mongoose.FilterQuery<typeof Business> = {};

    // Text search filter
    if (search) {
      filter.$or = [
        { businessName: { $regex: search as string, $options: 'i' } },
        { description: { $regex: search as string, $options: 'i' } }
      ];
    }

    // Basic filters
    if (type) filter.businessType = type as string;
    if (industry) filter.industry = industry as string;
    if (location) filter['contact.address'] = { 
      $regex: location as string, 
      $options: 'i' 
    };

    // Numeric filters
    const numericFilters = {
      'financialData.revenue.amount': minRevenue,
      'financialData.cagr': minCagr,
      'financialData.profitMargin': minProfitMargin,
      'financialData.roi': minRoi,
      'financialData.customerRetention': minCustomerRetention
    };

    Object.entries(numericFilters).forEach(([field, value]) => {
      if (value) {
        const numericValue = parseFloat(value as string);
        if (!isNaN(numericValue)) {
          if (field === 'financialData.revenue.amount') {
            filter['financialData.revenue'] = { 
              $elemMatch: { amount: { $gte: numericValue } } 
            };
          } else {
            filter[field] = { $gte: numericValue };
          }
        }
      }
    });

    // Sorting
    const sortOptions: Record<string, string | { [key: string]: mongoose.SortOrder }> = {
      businessName: 'asc',
      revenue: { 'financialData.revenue.amount': -1 },
      cagr: { 'financialData.cagr': -1 },
      profitMargin: { 'financialData.profitMargin': -1 },
      roi: { 'financialData.roi': -1 },
      customerRetention: { 'financialData.customerRetention': -1 }
    };

    // Authorization-based projection
    const isAdmin = req.user?.role === 'admin';
    const projection = isAdmin 
      ? '-password -tokens -__v' 
      : '-password -tokens -__v -financialData';

    // Database operations
    const [businesses, total] = await Promise.all([
      Business.find(filter)
        .sort(sortOptions[sortBy as string] ?? { businessName: 1 })
        .skip(skip)
        .limit(limitNumber)
        .select(projection)
        .lean(),
      Business.countDocuments(filter)
    ]);

    res.json({
      data: businesses,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber)
    });

  } catch (error) {
    console.error('Business listing error:', error);
    res.status(500).json({ 
      error: 'Failed to load businesses',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Get authenticated business profile
router.get('/me', async (req, res) => {
  try {
    if (!req.user?._id || !mongoose.isValidObjectId(req.user._id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const business = await Business.findById(req.user._id)
      .select('-password -tokens -__v')
      .lean();

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json(business);
  } catch (error) {
    console.error('Business profile error:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Get business by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid business ID format' });
    }

    const isOwner = req.user?._id?.toString() === id;
    const isAdmin = req.user?.role === 'admin';
    
    const projection = isAdmin || isOwner
      ? '-password -tokens -__v'
      : '-password -tokens -__v -financialData';

    const business = await Business.findById(id)
      .select(projection)
      .lean();

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json(business);
  } catch (error) {
    console.error('Business fetch error:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Update financial data (FIXED VERSION)
router.patch('/:id/financials', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate business ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid business ID format' });
    }

    // Check authorization
    if (req.user?._id?.toString() !== id && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized operation' });
    }

    // Check if financialData exists in request body
    if (!req.body.financialData) {
      return res.status(400).json({ error: 'financialData is required' });
    }

    // Validate financial data structure
    const validationError = validateFinancialData(req.body.financialData);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Safely build updates object
    const updates: Record<string, any> = {};
    
    // Only include fields that exist in the request
    Object.keys(req.body.financialData).forEach(key => {
      if (req.body.financialData[key] !== undefined) {
        updates[`financialData.${key}`] = req.body.financialData[key];
      }
    });

    // Apply updates
    const updatedBusiness = await Business.findByIdAndUpdate(
      id,
      { $set: updates },
      { 
        new: true, 
        runValidators: true,
        context: 'query' // Ensures validators run with the correct context
      }
    ).select('-password -tokens -__v');

    if (!updatedBusiness) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json(updatedBusiness);
  } catch (error) {
    console.error('Financial update error:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    });
  }
});

// ======================== HELPER FUNCTIONS ========================

/**
 * Validates financial data structure
 */
const validateFinancialData = (data: any): string | null => {
  const errors: string[] = [];

  // Check if data exists
  if (!data) {
    return 'Financial data is required';
  }

  // Validate revenue array if present
  if (data.revenue) {
    if (!Array.isArray(data.revenue)) {
      errors.push('Revenue must be an array');
    } else {
      data.revenue.forEach((entry: any, index: number) => {
        if (typeof entry.year !== 'number' || entry.year < 0) {
          errors.push(`Revenue entry ${index + 1}: Invalid year`);
        }
        if (typeof entry.amount !== 'number' || entry.amount < 0) {
          errors.push(`Revenue entry ${index + 1}: Invalid amount`);
        }
      });
    }
  }

  // Validate percentage fields
  const percentageFields = {
    cagr: data?.cagr,
    profitMargin: data?.profitMargin,
    customerRetention: data?.customerRetention
  };

  Object.entries(percentageFields).forEach(([field, value]) => {
    if (value !== undefined) {
      if (typeof value !== 'number') {
        errors.push(`${field} must be a number`);
      } else if (value < 0 || value > 100) {
        errors.push(`${field} must be between 0 and 100`);
      }
    }
  });

  // Validate ROI if present
  if (data.roi !== undefined && typeof data.roi !== 'number') {
    errors.push('ROI must be a number');
  }

  return errors.length ? errors.join(', ') : null;
};

export default router;
