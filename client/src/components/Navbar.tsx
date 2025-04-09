import {
  AddBusiness,
  Business as BusinessIcon,
  Home,
  Message,
  Person
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  Toolbar,
  Typography
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <BusinessIcon sx={{ mr: 1 }} />
          Business Directory
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Always visible links */}
          <Button 
            color="inherit" 
            component={Link} 
            to="/" 
            startIcon={<Home />}
          >
            Home
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/businesses" 
            startIcon={<BusinessIcon />}
          >
            Businesses
          </Button>

          {user ? (
            <>
              {/* Authenticated user links */}
              <Button 
                color="inherit" 
                component={Link} 
                to="/messages"
                startIcon={<Message />}
              >
                Messages
              </Button>
              
              {user.role === 'business' && (
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/add-product"
                  startIcon={<AddBusiness />}
                >
                  Add Product
                </Button>
              )}

              <Button 
                color="inherit" 
                component={Link} 
                to="/profile"
                startIcon={<Person />}
              >
                Profile
              </Button>
              <Button 
                color="inherit" 
                onClick={logout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              {/* Guest links */}
              <Button 
                color="inherit" 
                component={Link} 
                to="/login"
              >
                Login
              </Button>
              <Button 
                color="inherit" 
                component={Link} 
                to="/register"
              >
                Register
              </Button>
              <Button 
                color="inherit" 
                component={Link} 
                to="/register-business"
              >
                Register Business
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
