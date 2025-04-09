import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppQueryClientProvider } from './app/QueryClientProvider';
import Navbar from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
import BusinessDetailPage from './pages/BusinessDetailPage';
import BusinessListPage from './pages/BusinessListPage';
import BusinessRegisterPage from './pages/BusinessRegisterPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MessageInbox from './pages/MessageInbox';
import ProductForm from './pages/ProductForm';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#FFC107',
      contrastText: '#000000',
    },
    secondary: {
      main: '#212121',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e0e0e0',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          textTransform: 'none',
          borderRadius: '8px',
          padding: '8px 16px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        },
      },
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h3: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
  },
});

function App() {
  return (
    <AppQueryClientProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/register-business" element={<BusinessRegisterPage />} />
              <Route path="/businesses" element={<BusinessListPage />} />
              <Route path="/business/:id" element={<BusinessDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/messages" element={<MessageInbox />} />
              <Route path="/add-product" element={<ProductForm />} />
              <Route path="/business/:id/add-product" element={<ProductForm />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </AppQueryClientProvider>
  );
}

export default App;