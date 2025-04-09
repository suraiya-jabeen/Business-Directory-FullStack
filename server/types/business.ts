// src/types/business.ts
export interface BusinessContact {
  email?: string;
  phone?: string;
  address?: string;
}

export interface BusinessProduct {
  name: string;
  description?: string;
  price?: number;
  available: boolean;
}

export interface BusinessRevenue {
  year: number;
  amount: number;
}

export interface BusinessFinancialData {
  revenue?: BusinessRevenue[];
  cagr?: number;
  profitMargin?: number;
  roi?: number;
  customerRetention?: number;
}

export interface Business extends Document {
  _id: string;
  businessName: string;
  businessType: 'Private' | 'Corporation' | 'Partnership' | 'LLC' | 'Non-Profit';
  description?: string;
  contact?: BusinessContact;
  productsServices?: BusinessProduct[];
  financialData?: BusinessFinancialData;
  // From User model
  email: string;
  role: string;
}
