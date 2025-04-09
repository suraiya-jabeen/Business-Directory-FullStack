import {
  Button, CircularProgress, Grid,
  Typography
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface Product {
  name: string;
  description: string;
  price: number;
}

interface ProductFormProps {
  onSuccess?: () => void;
}

export default function ProductForm({ onSuccess }: ProductFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = React.useState<Product>({
    name: '',
    description: '',
    price: 0,
  });
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Combined authorization check
  React.useEffect(() => {
    const checkAuth = () => {
      if (!user || user.role !== 'business') {
        navigate('/login');
      }
    };
    
    try {
      checkAuth();
    } catch (_error) {  // Fixed: Using _error convention for unused variables
      // Optional: Add error handling if needed
    }
  }, [user, navigate]);

  const routeBusinessId = user?.businessId; // Assuming user object contains businessId

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Enhanced validation
    if (!product.name.trim()) {
      setError('Product name is required');
      return;
    }
    if (product.price < 0) {
      setError('Price cannot be negative');
      return;
    }
  
    setLoading(true);
    
    try {
      const response = await api.post(`/business/${routeBusinessId}/products`, {
        name: product.name.trim(),
        description: product.description.trim(),
        price: Number(product.price)
      });
  
      if (response.status === 201) {
        setProduct({ name: '', description: '', price: 0 });
        onSuccess?.();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {/* Form fields here */}
        
        {error && (
          <Grid item xs={12}>
            <Typography color="error">{error}</Typography>
          </Grid>
        )}

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading || !user}
          >
            {loading ? <CircularProgress size={24} /> : 'Add Product'}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}
