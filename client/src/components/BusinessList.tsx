import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Pagination,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface Business {
  _id: string;
  businessName: string;
  businessType: string;
  description?: string;
  productsServices: Array<{
    _id: string;
    name: string;
    price: number;
  }>;
}

// Remove the unused loading state if you're not using it
// Or actually use it in your component if needed
export default function BusinessList() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  // Remove this if not needed: const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  // Function to handle page change
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const fetchBusinesses = async (pageNumber: number) => {
    // setLoading(true); // Remove if not using loading state
    setError(null);

    try {
      const response = await api.get('/business', {
        params: { page: pageNumber }
      });
      setBusinesses(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      setError('Failed to load businesses. Please log in and try again.');
      console.error('Error fetching businesses:', error);
    } finally {
      // setLoading(false); // Remove if not using loading state
    }
  };

  // ... rest of component


  useEffect(() => {
    if (user) { // Only fetch if user is authenticated
      fetchBusinesses(page);
    } else {
      setError('Please log in to view businesses');
    
    }
  }, [page, user]);

  if (!user) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography variant="h6">Please log in to view businesses</Typography>
      </Box>
    );
  }

return (
  <Box>
    <Typography variant="h4" component="h1" gutterBottom>
      Businesses
    </Typography>

    {error && <Alert severity="error">{error}</Alert>} {/* Show error if any */}

    <Grid container spacing={3}>
      {businesses.length > 0 ? (
        businesses.map((business) => (
          <Grid item xs={12} sm={6} md={4} key={business._id}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {business.businessName}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Type: {business.businessType}
                </Typography>
                {business.description && (
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {business.description}
                  </Typography>
                )}
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>Products/Services:</strong>
                </Typography>
                <ul>
                  {business.productsServices.map((product) => (
                    <li key={product._id}>
                      {product.name} - ${product.price.toFixed(2)}
                    </li>
                  ))}
                </ul>

                <Button
                  variant="outlined"
                  component={Link}
                  to={`/business/${business._id}`}
                  fullWidth
                  sx={{ marginTop: 2 }}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))
      ) : (
        <Typography variant="body1" color="textSecondary">
          No businesses available.
        </Typography>
      )}
    </Grid>

    <Box display="flex" justifyContent="center" mt={4}>
      <Pagination
        count={totalPages}
        page={page}
        onChange={handlePageChange}
        color="primary"
        size="large"
      />
    </Box>
  </Box>
);
}
