export interface Business {
  _id: string;
  businessName: string;
  businessType: string;
  industry: string; // Add this line
  description?: string;
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  financialData?: {
    revenue?: Array<{ year: number; amount: number }>;
    cagr?: number;
    profitMargin?: number;
    roi?: number;
    customerRetention?: number;
  };
  role?: string; // Added
  email?: string; // Added
}