// src/utils/validations.ts
interface RevenueEntry {
  year: number;
  amount: number;
  currency?: string;
}

interface FinancialData {
  revenue?: RevenueEntry[];
  cagr?: number;
  profitMargin?: number;
  customerRetention?: number;
  roi?: number;
}

type FinancialFormErrors = {
  revenue?: string;
  [key: string]: string | undefined; // For dynamic field errors
};

export const validateFinancialForm = (data: FinancialData): FinancialFormErrors => {
  const errors: FinancialFormErrors = {};
  const currentYear = new Date().getFullYear();
  const MAX_FUTURE_YEARS = 5;

  // Revenue validation - more robust checks
  if (!data.revenue || data.revenue.length === 0) {
    errors.revenue = "At least one revenue entry is required";
  } else {
    data.revenue.forEach((entry, index) => {
      const baseKey = `revenue[${index}]`;
      
      // Year validation
      if (isNaN(entry.year)) {
        errors[`${baseKey}.year`] = "Year must be a valid number";
      } else if (entry.year < 2000) {
        errors[`${baseKey}.year`] = "Year cannot be before 2000";
      } else if (entry.year > currentYear + MAX_FUTURE_YEARS) {
        errors[`${baseKey}.year`] = `Year cannot be more than ${MAX_FUTURE_YEARS} years in the future`;
      }

      // Amount validation
      if (isNaN(entry.amount)) {
        errors[`${baseKey}.amount`] = "Amount must be a valid number";
      } else if (entry.amount < 0) {
        errors[`${baseKey}.amount`] = "Amount cannot be negative";
      } else if (entry.amount > 1000000000) { // 1 billion
        errors[`${baseKey}.amount`] = "Amount exceeds maximum limit";
      }
    });
  }

  // Percentage validation helper
  const validatePercentage = (
    value: number | undefined, 
    field: keyof FinancialData,
    label: string
  ) => {
    if (value === undefined) return;
    
    if (isNaN(value)) {
      errors[field] = `${label} must be a valid number`;
    } else if (value < 0) {
      errors[field] = `${label} cannot be negative`;
    } else if (value > 1000) { // Allow for percentages > 100% when needed
      errors[field] = `${label} exceeds maximum value`;
    }
  };

  // Validate all percentage-based fields
  validatePercentage(data.cagr, 'cagr', 'CAGR');
  validatePercentage(data.profitMargin, 'profitMargin', 'Profit Margin');
  validatePercentage(data.customerRetention, 'customerRetention', 'Customer Retention');
  validatePercentage(data.roi, 'roi', 'ROI');

  // Additional business rule: If profit margin exists, it should be <= revenue
  if (data.profitMargin !== undefined && data.revenue?.length) {
    const totalRevenue = data.revenue.reduce((sum, entry) => sum + entry.amount, 0);
    const maxProfit = totalRevenue * 0.5; // Example: Profit shouldn't exceed 50% of revenue
    if (data.profitMargin > maxProfit) {
      errors.profitMargin = `Profit margin seems unusually high compared to revenue`;
    }
  }

  return errors;
};

// Helper function to check if there are any errors
export const hasValidationErrors = (errors: FinancialFormErrors): boolean => {
  return Object.keys(errors).length > 0;
};