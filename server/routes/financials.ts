import express from 'express';
import authMiddleware from '../middleware/auth';
import Business from '../models/Business';

// Function to validate financial data
function validateFinancialData(financialData: any): string | null {
  if (!financialData || typeof financialData !== 'object') {
    return 'Invalid financial data';
  }
  // Add more validation logic as needed
  return null;
}

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Example of a PUT request to update financials
router.put('/:id', async (req, res) => {
  try {
    const businessId = req.params.id;
    const { financialData } = req.body;

    // Check if user is authorized to update financial data
    if (req.user?._id?.toString() !== businessId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized operation' });
    }

    // Validate financial data
    const validationError = validateFinancialData(financialData);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Update financial data
    const updatedBusiness = await Business.findByIdAndUpdate(
      businessId,
      { $set: { financialData } },
      { new: true, runValidators: true }
    ).select('-password -tokens -__v');

    if (!updatedBusiness) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json(updatedBusiness);
  } catch (error) {
    console.error('Error updating financials:', error);
    res.status(500).json({ error: 'Failed to update financials' });
  }
});

export default router;


