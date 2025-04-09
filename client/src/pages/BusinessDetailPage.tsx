import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { AxiosError } from 'axios';
import { Chart, registerables } from 'chart.js';
import { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { useParams } from 'react-router-dom';
import ProductList from '../components/ProductList';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Register Chart.js components
Chart.register(...registerables);

interface RevenueEntry {
  year: number;
  amount: number;
}

interface FinancialData {
  revenue?: RevenueEntry[];
  cagr?: number;
  profitMargin?: number;
  roi?: number;
  customerRetention?: number;
}

interface Business {
  _id: string;
  businessName: string;
  businessType: string;
  description?: string;
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  financialData?: FinancialData;
  role?: string;
  productsServices?: Array<{
    _id?: string;
    name: string;
    description?: string;
    price?: number;
    available?: boolean;
  }>;
}

export default function BusinessDetailPage() {
  const theme = useTheme();
  const { user } = useAuth();
  const { id } = useParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [financialEdit, setFinancialEdit] = useState<FinancialData>({
    revenue: [],
    cagr: 0,
    profitMargin: 0,
    roi: 0,
    customerRetention: 0
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/business/${id}`);
        setBusiness(response.data);
      } catch (err) {
        setError('Failed to load business data');
        console.error('Error fetching business:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
  }, [id]);

  const handleEditOpen = () => {
    setFinancialEdit(business?.financialData || {
      revenue: [],
      cagr: 0,
      profitMargin: 0,
      roi: 0,
      customerRetention: 0
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
  
    try {
      const payload = {
        financialData: {
          ...financialEdit,
          revenue: financialEdit.revenue?.map(r => ({
            year: Number(r.year),
            amount: Number(r.amount),
            currency: 'USD'
          }))
        }
      };
  
      const response = await api.patch(`/business/${id}/financials`, payload);
      setBusiness(prev => ({ ...prev!, financialData: response.data.financialData }));
      setEditOpen(false);
    } catch (error) {
      const axiosError = error as AxiosError<{
        message?: string;
      }>;
      
      setError(
        axiosError.response?.data?.message ||
        axiosError.message ||
        'Failed to update financial data'
      );
    } finally {
      setSaving(false);
    }
  };

  <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
  <DialogTitle>Edit Financial Data</DialogTitle>
  <DialogContent>
    {error && (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )}
    {/* Rest of your dialog content */}
  </DialogContent>
</Dialog>

  // Prepare chart data
  const chartData = {
    revenue: {
      labels: business?.financialData?.revenue?.map(r => r.year.toString()) || [],
      datasets: [{
        label: 'Revenue (USD)',
        data: business?.financialData?.revenue?.map(r => r.amount) || [],
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light,
        tension: 0.3,
        fill: true,
        borderWidth: 2
      }]
    },
    metrics: {
      labels: ['Performance Metrics'],
      datasets: [
        {
          label: 'CAGR (%)',
          data: [business?.financialData?.cagr || 0],
          backgroundColor: theme.palette.success.main
        },
        {
          label: 'Profit Margin (%)',
          data: [business?.financialData?.profitMargin || 0],
          backgroundColor: theme.palette.info.main
        },
        {
          label: 'ROI (%)',
          data: [business?.financialData?.roi || 0],
          backgroundColor: theme.palette.warning.main
        },
        {
          label: 'Customer Retention (%)',
          data: [business?.financialData?.customerRetention || 0],
          backgroundColor: theme.palette.error.main
        }
      ]
    }
  };

  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += context.dataset.label.includes('USD')
                ? `$${context.parsed.y.toLocaleString()}`
                : `${context.parsed.y.toFixed(1)}%`;
            }
            return label;
          }
        }
      }
    }
  };

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!business) return <Typography>Business not found</Typography>;

  const hasFinancialData = (business.financialData?.revenue ?? []).length > 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h3" gutterBottom>
          {business.businessName}
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          {business.businessType}
        </Typography>
        {business.description && <Typography>{business.description}</Typography>}
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Contact Information
              </Typography>
              {business.contact?.email && (
                <Typography><strong>Email:</strong> {business.contact.email}</Typography>
              )}
              {business.contact?.phone && (
                <Typography><strong>Phone:</strong> {business.contact.phone}</Typography>
              )}
              {business.contact?.address && (
                <Typography><strong>Address:</strong> {business.contact.address}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h5" gutterBottom>
                  Financial Overview
                </Typography>
                {user?.role === 'business' && user._id === business._id && (
                  <Button size="small" onClick={handleEditOpen}>
                    Edit
                  </Button>
                )}
              </Box>

              {hasFinancialData ? (
                <>
                  <Box sx={{ height: 300, mb: 4 }}>
                    <Line
                      data={chartData.revenue}
                      options={{
                        ...commonChartOptions,
                        scales: {
                          y: {
                            beginAtZero: false,
                            ticks: {
                              callback: (value) => `$${Number(value).toLocaleString()}`
                            }
                          }
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ height: 250 }}>
                    <Bar
                      data={chartData.metrics}
                      options={{
                        ...commonChartOptions,
                        indexAxis: 'y' as const,
                        scales: {
                          x: {
                            stacked: true,
                            ticks: {
                              callback: (value) => `${value}%`
                            }
                          },
                          y: { stacked: true }
                        }
                      }}
                    />
                  </Box>
                </>
              ) : (
                <Box py={4} textAlign="center">
                  <Typography color="text.secondary">
                    No financial data available
                  </Typography>
                  {user?.role === 'business' && user._id === business._id && (
                    <Button onClick={handleEditOpen} sx={{ mt: 2 }}>
                      Add Financial Data
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Products & Services
              </Typography>
              <ProductList products={business.productsServices || []} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Financial Data Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Financial Data</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Revenue Data</Typography>
            {(financialEdit.revenue || []).map((item, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  label="Year"
                  type="number"
                  value={item.year}
                  onChange={(e) => {
                    const newRevenue = [...(financialEdit.revenue || [])];
                    newRevenue[index].year = Number(e.target.value);
                    setFinancialEdit({ ...financialEdit, revenue: newRevenue });
                  }}
                />
                <TextField
                  label="Amount ($)"
                  type="number"
                  value={item.amount}
                  onChange={(e) => {
                    const newRevenue = [...(financialEdit.revenue || [])];
                    newRevenue[index].amount = Number(e.target.value);
                    setFinancialEdit({ ...financialEdit, revenue: newRevenue });
                  }}
                />
                <Button
                  color="error"
                  onClick={() => {
                    const newRevenue = (financialEdit.revenue || []).filter((_, i) => i !== index);
                    setFinancialEdit({ ...financialEdit, revenue: newRevenue });
                  }}
                >
                  Remove
                </Button>
              </Box>
            ))}
            <Button
              variant="outlined"
              onClick={() => {
                setFinancialEdit({
                  ...financialEdit,
                  revenue: [...(financialEdit.revenue || []), 
                    { year: new Date().getFullYear(), amount: 0 }
                  ]
                });
              }}
            >
              Add Year
            </Button>

            <Grid container spacing={2} sx={{ mt: 3 }}>
              <Grid item xs={6}>
                <TextField
                  label="CAGR (%)"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                  value={financialEdit.cagr ?? ''}
                  onChange={(e) => setFinancialEdit({
                    ...financialEdit,
                    cagr: Number(e.target.value)
                  })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Profit Margin (%)"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                  value={financialEdit.profitMargin ?? ''}
                  onChange={(e) => setFinancialEdit({
                    ...financialEdit,
                    profitMargin: Number(e.target.value)
                  })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="ROI (%)"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0, step: 0.1 }}
                  value={financialEdit.roi ?? ''}
                  onChange={(e) => setFinancialEdit({
                    ...financialEdit,
                    roi: Number(e.target.value)
                  })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Customer Retention (%)"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                  value={financialEdit.customerRetention ?? ''}
                  onChange={(e) => setFinancialEdit({
                    ...financialEdit,
                    customerRetention: Number(e.target.value)
                  })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}