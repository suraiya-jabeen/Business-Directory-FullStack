import {
  Button,
  CircularProgress,
  Container,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const businessTypes = ['Private', 'Corporation', 'Partnership', 'LLC', 'Non-Profit'];
const industries = [
  'Technology',
  'Retail',
  'Healthcare',
  'Manufacturing',
  'Finance',
  'Hospitality'
];

interface BusinessFormData {
  email: string;
  password: string;
  confirmPassword: string;
  businessName: string;
  businessType: string;
  industry: string;
  description: string;
  contact: {
    phone: string;
    address: string;
  };
}

export default function BusinessRegisterPage() {
  const [formData, setFormData] = useState<BusinessFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessType: 'Private',
    industry: 'Technology',
    description: '',
    contact: { phone: '', address: '' }
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const { email, password, confirmPassword } = formData;
    
    if (!email || !password || !confirmPassword) {
      setError('All required fields must be filled');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
      setError('Password must contain uppercase, lowercase, number, and special character');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        email: formData.email.toLowerCase().trim(),
        confirmPassword: undefined
      };

      const response = await api.post('/auth/register/business', payload);

      if (response.status === 201) {
        navigate('/login', { state: { registrationSuccess: true } });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 
                         err.response?.data?.message ||
                         'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleContactChange = (field: keyof BusinessFormData['contact'], value: string) => {
    setFormData(prev => ({
      ...prev,
      contact: { ...prev.contact, [field]: value }
    }));
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, position: 'relative' }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
          Business Registration
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
            {error}
          </Typography>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Credentials Section */}
            <Grid item xs={12}>
              <TextField
                label="Business Email"
                type="email"
                fullWidth
                required
                autoComplete="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Password"
                type="password"
                fullWidth
                required
                autoComplete="new-password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                helperText="8+ chars with uppercase, lowercase, number, and special character"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Confirm Password"
                type="password"
                fullWidth
                required
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </Grid>

            {/* Business Information Section */}
            <Grid item xs={12}>
              <TextField
                label="Business Name"
                fullWidth
                required
                value={formData.businessName}
                onChange={e => setFormData({ ...formData, businessName: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Business Type"
                fullWidth
                required
                value={formData.businessType}
                onChange={e => setFormData({ ...formData, businessType: e.target.value })}
              >
                {businessTypes.map(type => (
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
                onChange={e => setFormData({ ...formData, industry: e.target.value })}
              >
                {industries.map(industry => (
                  <MenuItem key={industry} value={industry}>{industry}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Business Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>

            {/* Contact Information Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Contact Details
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Phone Number"
                fullWidth
                value={formData.contact.phone}
                onChange={e => handleContactChange('phone', e.target.value)}
                inputProps={{ 
                  pattern: "^[+]?[0-9\\s-]{6,20}$",
                  title: "Valid formats: +123456789, 123-456-7890" 
                }}
                helperText="International format: +[country code][number]"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Business Address"
                fullWidth
                multiline
                rows={2}
                value={formData.contact.address}
                onChange={e => handleContactChange('address', e.target.value)}
              />
            </Grid>

            {/* Submission Button */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={loading}
                aria-label="Register business account"
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Register Business'
                )}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}
