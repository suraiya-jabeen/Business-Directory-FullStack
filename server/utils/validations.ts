import router from "../routes/auth";

// server/utils/validations.ts
export const validateFinancialData = (data: any): { isValid: boolean; error?: string } => {
    if (!data) return { isValid: false, error: "Financial data is required" };
  
    // Validate revenue array structure
    if (data.revenue && !Array.isArray(data.revenue)) {
      return { isValid: false, error: "Revenue must be an array" };
    }
  
    // Validate individual fields
    const percentageFields = ["cagr", "profitMargin", "customerRetention"];
    for (const field of percentageFields) {
      if (data[field] && (data[field] < 0 || data[field] > 100)) {
        return { isValid: false, error: `${field} must be 0-100%` };
      }
    }
  
    return { isValid: true };
  };
  
  // In your route handler
  router.patch("/:id/financials", async (req, res) => {
    const validation = validateFinancialData(req.body.financialData);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }
    // Proceed with update...
  });
