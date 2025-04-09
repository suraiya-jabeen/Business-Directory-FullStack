// src/components/BusinessForm.tsx

import { Button, CircularProgress, Grid, MenuItem, TextField, Typography } from '@mui/material';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface BusinessFormProps {
  onSuccess?: () => void;
}

export default function BusinessForm({ onSuccess }: BusinessFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = React.useState({
    businessName: '',
    businessType: 'Private',
    industry: 'Technology', // Add this line
    description: '',
    contact: { email: '', phone: '', address: '' }
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/api/auth/register/business', {
        ...formData,
        email: user?.email || '',
        password: 'temporary-password' // Replace with real password handling
      });
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

// Add industry field in the form
<Grid item xs={12} md={6}>
  <TextField
    select
    label="Industry"
    fullWidth
    required
    value={formData.industry}
    onChange={(e) => setFormData({...formData, industry: e.target.value})}
  >
    {['Technology','Retail','Healthcare','Manufacturing','Finance','Hospitality'].map(industry => (
      <MenuItem key={industry} value={industry}>{industry}</MenuItem>
    ))}
  </TextField>
</Grid>

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Register Your Business
          </Typography>
          {error && <Typography color="error">{error}</Typography>}
        </Grid>
        
        {/* Add all form fields similar to your backend schema */}
        <Grid item xs={12}>
          <TextField
            label="Business Name"
            fullWidth
            required
            value={formData.businessName}
            onChange={(e) => setFormData({...formData, businessName: e.target.value})}
          />
        </Grid>
        
        {/* Add other fields (businessType, description, contact info) */}
        
        <Grid item xs={12}>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Register Business'}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}
