import { Search } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  InputAdornment,
  MenuItem,
  Pagination,
  Select,
  TextField,
  Typography
} from '@mui/material';
import { Business } from '@shared/types/business';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from 'src/context/AuthContext';
import api from 'src/services/api';

type SortOption = 'businessName' | 'revenue' | 'cagr' | 'profitMargin' | 'roi' | 'customerRetention';
type FilterKey = 'type' | 'industry' | 'cagr' | 'revenue' | 'profitMargin' | 'location' | 'search' | 'roi' | 'customerRetention';

const defaultFilters = {
  type: '',
  industry: '',
  cagr: '',
  revenue: '',
  profitMargin: '',
  location: '',
  search: '',
  roi: '',
  customerRetention: ''
};

const BusinessListPage = (): JSX.Element => {
  const { user } = useAuth();
  
  // Move ALL hooks to the top, before any conditionals
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filters, setFilters] = useState<Record<FilterKey, string>>(defaultFilters);
  const [sortBy, setSortBy] = useState<SortOption>('businessName');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const formatFinancialValue = useCallback((value?: number, isPercentage = false) => {
    if (typeof value !== 'number') return 'N/A';
    return isPercentage ? `${value.toFixed(1)}%` : `$${value.toLocaleString()}`;
  }, []);

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/business', {
        params: {
          page,
          sortBy,
          search: filters.search,
          type: filters.type,
          industry: filters.industry,
          minRevenue: filters.revenue,
          minCagr: filters.cagr,
          minProfitMargin: filters.profitMargin,
          minRoi: filters.roi,
          minCustomerRetention: filters.customerRetention,
          location: filters.location
        }
      });
      setBusinesses(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error('Failed to load businesses:', err);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, filters]);

  useEffect(() => {
    if (user) { // Now this conditional is AFTER all hooks
      const debounceTimer = setTimeout(fetchBusinesses, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [fetchBusinesses, user]);

  const handleFilterChange = useCallback((filter: FilterKey, value: string) => {
    if (['cagr', 'revenue', 'profitMargin', 'roi', 'customerRetention'].includes(filter)) {
      if (value && !/^\d*\.?\d*$/.test(value)) return;
    }
    
    setFilters(prev => ({ ...prev, [filter]: value }));
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSortBy('businessName');
    setPage(1);
  }, []);

  if (!user) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h4">Please log in to view businesses</Typography>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ 
          fontWeight: 700, 
          color: 'primary.main', 
          mb: 2,
          fontSize: { xs: '2rem', md: '3rem' }
        }}>
          Business Directory
        </Typography>
        
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search businesses..."
          value={filters.search}
          onChange={e => handleFilterChange('search', e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
            sx: { borderRadius: 4 }
          }}
          sx={{ 
            maxWidth: 800, 
            mx: 'auto', 
            mb: 3,
            '& .MuiOutlinedInput-root': {
              fieldset: { borderWidth: 2 }
            }
          }}
        />
      </Box>

      <Card sx={{ 
        mb: 4, 
        p: 2, 
        borderRadius: 4, 
        boxShadow: 3, 
        border: '2px solid',
        borderColor: 'divider'
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2}>
            <Select
              fullWidth
              value={filters.type}
              onChange={e => handleFilterChange('type', e.target.value)}
              displayEmpty
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Types</MenuItem>
              {['Private', 'Corporation', 'Partnership', 'LLC', 'Non-Profit'].map(type => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid item xs={12} md={2}>
            <Select
              fullWidth
              value={filters.industry}
              onChange={e => handleFilterChange('industry', e.target.value)}
              displayEmpty
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Industries</MenuItem>
              {['Technology', 'Retail', 'Healthcare', 'Manufacturing', 'Finance', 'Hospitality'].map(industry => (
                <MenuItem key={industry} value={industry}>{industry}</MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid item xs={6} md={1.5}>
            <TextField
              fullWidth
              label="Min CAGR"
              type="number"
              value={filters.cagr}
              onChange={e => handleFilterChange('cagr', e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                inputProps: { 
                  min: 0, 
                  max: 100, 
                  step: 0.1 
                }
              }}
            />
          </Grid>

          <Grid item xs={6} md={1.5}>
            <TextField
              fullWidth
              label="Min Revenue"
              type="number"
              value={filters.revenue}
              onChange={e => handleFilterChange('revenue', e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                inputProps: { 
                  min: 0, 
                  step: 1000 
                }
              }}
            />
          </Grid>

          <Grid item xs={6} md={1.5}>
            <TextField
              fullWidth
              label="Min Profit"
              type="number"
              value={filters.profitMargin}
              onChange={e => handleFilterChange('profitMargin', e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                inputProps: { 
                  min: 0, 
                  max: 100, 
                  step: 0.1 
                }
              }}
            />
          </Grid>

          <Grid item xs={6} md={1.5}>
            <TextField
              fullWidth
              label="Min ROI"
              type="number"
              value={filters.roi}
              onChange={e => handleFilterChange('roi', e.target.value)}
              InputProps={{
                inputProps: { 
                  min: 0, 
                  step: 1 
                }
              }}
            />
          </Grid>

          <Grid item xs={6} md={1.5}>
            <TextField
              fullWidth
              label="Min Retention"
              type="number"
              value={filters.customerRetention}
              onChange={e => handleFilterChange('customerRetention', e.target.value)}
              InputProps={{
                inputProps: { 
                  min: 0, 
                  max: 100, 
                  step: 1 
                }
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Location"
              value={filters.location}
              onChange={e => handleFilterChange('location', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={2} sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="secondary"
              sx={{ flex: 1, borderRadius: 2 }}
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ 
          mt: 3, 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 2, 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <Select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            sx={{ 
              minWidth: 200, 
              borderRadius: 2,
              '& .MuiSelect-select': { py: 1.5 }
            }}
          >
            <MenuItem value="businessName">Sort by Name</MenuItem>
            <MenuItem value="revenue">Sort by Revenue</MenuItem>
            <MenuItem value="cagr">Sort by CAGR</MenuItem>
            <MenuItem value="profitMargin">Sort by Profit Margin</MenuItem>
            <MenuItem value="roi">Sort by ROI</MenuItem>
            <MenuItem value="customerRetention">Sort by Retention</MenuItem>
          </Select>

          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            shape="rounded"
            siblingCount={1}
            boundaryCount={1}
            sx={{
              '& .MuiPaginationItem-root': {
                fontSize: '1rem',
                minWidth: 36,
                height: 36
              }
            }}
          />
        </Box>
      </Card>

      <Grid container spacing={3}>
        {businesses.map(business => (
          <Grid item key={business._id} xs={12} sm={6} md={4} lg={3}>
            <Card sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              boxShadow: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6
              }
            }}>
              <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 700,
                  lineHeight: 1.2,
                  minHeight: '3em'
                }}>
                  {business.businessName}
                </Typography>
                
                <Box sx={{ 
                  mb: 1.5, 
                  display: 'flex', 
                  gap: 1, 
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 500,
                    color: 'text.secondary',
                    bgcolor: 'action.hover',
                    px: 1,
                    borderRadius: 1
                  }}>
                    {business.businessType}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 500,
                    color: 'primary.main',
                    bgcolor: 'action.selected',
                    px: 1,
                    borderRadius: 1
                  }}>
                    {business.industry}
                  </Typography>
                </Box>

                {business.contact?.address && (
                  <Typography variant="body2" sx={{ 
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: 'text.secondary'
                  }}>
                    📍 {business.contact.address}
                  </Typography>
                )}

                {business.description && (
                  <Typography variant="body2" paragraph sx={{ 
                    lineHeight: 1.5,
                    color: 'text.secondary',
                    minHeight: '4.5em'
                  }}>
                    {business.description}
                  </Typography>
                )}

                {(user?.role === 'admin' || user?._id === business._id) && (
                  <Box sx={{ mt: 'auto' }}>
                    <Grid container spacing={1}>
                      {[
                        { label: 'Revenue', value: business.financialData?.revenue?.[0]?.amount },
                        { label: 'CAGR', value: business.financialData?.cagr, isPercentage: true },
                        { label: 'Profit', value: business.financialData?.profitMargin, isPercentage: true },
                        { label: 'ROI', value: business.financialData?.roi, isPercentage: true }
                      ].map((metric, index) => (
                        <Grid item xs={6} key={index}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {metric.label}:{' '}
                            <Box component="span" color="primary.main">
                              {formatFinancialValue(metric.value, metric.isPercentage)}
                            </Box>
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {businesses.length === 0 && !loading && (
        <Box sx={{ 
          py: 8, 
          textAlign: 'center', 
          color: 'text.secondary',
          borderTop: '2px dashed',
          borderColor: 'divider',
          mt: 4
        }}>
          <Typography variant="h5" gutterBottom>
            No businesses found
          </Typography>
          <Typography variant="body1">
            Try adjusting your filters or search terms
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default BusinessListPage;
