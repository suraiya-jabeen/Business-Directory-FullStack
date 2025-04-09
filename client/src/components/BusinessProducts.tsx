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
    industry: 'Technology',
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

  const handleChange = (field: string, value: string) => {
    if (field.includes('contact.')) {
      const contactField = field.split('.')[1] as keyof typeof formData.contact;
      setFormData({
        ...formData,
        contact: {
          ...formData.contact,
          [contactField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [field]: value
      });
    }
  };

  const industries = [
    'Technology',
    'Retail',
    'Healthcare',
    'Manufacturing', // Fixed typo from "Manufacturing"
    'Finance',
    'Hospitality' // Fixed typo from "Hospitality"
  ];

  const businessTypes = [
    'Private',
    'Public',
    'Non-profit',
    'Government'
  ];

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Register Your Business
          </Typography>
          {error && <Typography color="error">{error}</Typography>}
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="Business Name"
            fullWidth
            required
            value={formData.businessName}
            onChange={(e) => handleChange('businessName', e.target.value)}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            select
            label="Business Type"
            fullWidth
            required
            value={formData.businessType}
            onChange={(e) => handleChange('businessType', e.target.value)}
          >
            {businessTypes.map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            select
            label="Industry"
            fullWidth
            required
            value={formData.industry}
            onChange={(e) => handleChange('industry', e.target.value)}
          >
            {industries.map((industry) => (
              <MenuItem key={industry} value={industry}>{industry}</MenuItem>
            ))}
          </TextField>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            label="Contact Email"
            fullWidth
            type="email"
            value={formData.contact.email}
            onChange={(e) => handleChange('contact.email', e.target.value)}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            label="Contact Phone"
            fullWidth
            value={formData.contact.phone}
            onChange={(e) => handleChange('contact.phone', e.target.value)}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            label="Address"
            fullWidth
            value={formData.contact.address}
            onChange={(e) => handleChange('contact.address', e.target.value)}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            fullWidth
            size="large"
          >
            {loading ? <CircularProgress size={24} /> : 'Register Business'}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}