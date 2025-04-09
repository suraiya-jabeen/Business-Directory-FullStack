import { Alert, Button, TextField } from "@mui/material";
import { useEffect, useState } from "react";

type RevenueEntry = {
  year: number;
  amount: number;
  currency?: string;
};

type FinancialData = {
  revenue: RevenueEntry[];
  cagr?: number;
  profitMargin?: number;
};

const BusinessFinancialForm = ({ 
  initialData, 
  onSave 
}: {
  initialData?: FinancialData | null;
  onSave: (data: FinancialData) => Promise<void>;
}) => {
  const emptyFinancialData: FinancialData = { revenue: [] };
  const [formData, setFormData] = useState<FinancialData>(emptyFinancialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(!initialData);

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setIsEditing(false);
    } else {
      setFormData(emptyFinancialData);
      setIsEditing(true);
    }
  }, [initialData]);

  const handleRevenueChange = (index: number, field: keyof RevenueEntry, value: string) => {
    const newRevenue = [...formData.revenue];
    newRevenue[index] = {
      ...newRevenue[index],
      [field]: field === 'year' ? parseInt(value) || 0 : parseFloat(value) || 0
    };
    setFormData({ ...formData, revenue: newRevenue });
  };

  const addRevenueEntry = () => {
    setFormData({
      ...formData,
      revenue: [...formData.revenue, { year: new Date().getFullYear(), amount: 0 }]
    });
  };

  const removeRevenueEntry = (index: number) => {
    const newRevenue = formData.revenue.filter((_, i) => i !== index);
    setFormData({ ...formData, revenue: newRevenue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation example - replace with your actual validation
    const validationErrors: Record<string, string> = {};
    if (formData.revenue.length === 0) {
      validationErrors.revenue = "At least one revenue entry is required";
    }
    
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length === 0) {
      try {
        await onSave(formData);
        setIsEditing(false);
      } catch (error) {
        setErrors({ ...errors, submit: 'Failed to save financial data' });
      }
    }
  };

  // View Mode
  if (!isEditing) {
    return (
      <div>
        <h3>Financial Overview</h3>
        {formData.revenue.length === 0 ? (
          <p>No financial data available</p>
        ) : (
          formData.revenue.map((entry, index) => (
            <div key={index}>
              Year: {entry.year} - Amount: {entry.amount} {entry.currency || 'USD'}
            </div>
          ))
        )}
        <Button 
          variant="contained" 
          onClick={() => setIsEditing(true)}
          sx={{ mt: 2 }}
        >
          {formData.revenue.length === 0 ? 'Add Financial Data' : 'Edit Financial Data'}
        </Button>
      </div>
    );
  }

  // Edit Mode
  return (
    <form onSubmit={handleSubmit}>
      <h3>{initialData ? 'Edit Financial Data' : 'Add Financial Data'}</h3>
      
      {formData.revenue.map((entry, index) => (
        <div key={index} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
          <TextField
            label="Year"
            type="number"
            value={entry.year}
            onChange={(e) => handleRevenueChange(index, 'year', e.target.value)}
            sx={{ mr: 2, width: 120 }}
            error={!!errors[`year-${index}`]}
            helperText={errors[`year-${index}`]}
          />
          <TextField
            label="Amount"
            type="number"
            value={entry.amount}
            onChange={(e) => handleRevenueChange(index, 'amount', e.target.value)}
            sx={{ mr: 2, width: 180 }}
            error={!!errors[`amount-${index}`]}
            helperText={errors[`amount-${index}`]}
          />
          <Button 
            variant="outlined" 
            color="error"
            onClick={() => removeRevenueEntry(index)}
            size="small"
          >
            Remove
          </Button>
        </div>
      ))}

      <Button 
        variant="outlined" 
        onClick={addRevenueEntry}
        sx={{ mb: 2 }}
      >
        Add Revenue Entry
      </Button>

      {errors.revenue && <Alert severity="error" sx={{ mb: 2 }}>{errors.revenue}</Alert>}
      {errors.submit && <Alert severity="error" sx={{ mb: 2 }}>{errors.submit}</Alert>}

      <div style={{ display: 'flex', gap: '8px' }}>
        <Button 
          variant="contained" 
          type="submit"
        >
          Save
        </Button>
        {initialData && (
          <Button 
            variant="outlined"
            onClick={() => {
              setIsEditing(false);
              setFormData(initialData);
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default BusinessFinancialForm;