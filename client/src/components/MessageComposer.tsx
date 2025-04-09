import {
  Autocomplete,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface MessageComposerProps {
  open: boolean;
  onClose: () => void;
  refreshMessages: () => void;
}

interface UserResult {
  _id: string;
  email: string;
  role: string;
  businessName?: string;
}

export default function MessageComposer({ open, onClose, refreshMessages }: MessageComposerProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<UserResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Enhanced search with loading state and error handling
  const handleSearch = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await api.get(`/users/search?query=${query}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`
        }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
      setError('Failed to search for users');
    } finally {
      setSearchLoading(false);
    }
  };

  // Optimized send handler with proper typing
  const handleSend = async () => {
    // Validate inputs
    if (!user?.token) {
      setError('You must be logged in');
      navigate('/login');
      return;
    }

    if (!selectedRecipient) {
      setError('Please select a recipient');
      return;
    }

    if (!content.trim()) {
      setError('Message cannot be empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/messages/send', {
        receiverId: selectedRecipient._id,
        content: content.trim()
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 201) {
        refreshMessages();
        handleClose();
      }
    } catch (error: unknown) {
      let errorMessage = 'Failed to send message';
      
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }

      setError(errorMessage);

      // Handle unauthorized error
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          logout();
          navigate('/login');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset all states when closing
    setSearchQuery('');
    setSearchResults([]);
    setSelectedRecipient(null);
    setContent('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>New Message</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {/* Recipient Search */}
        <Autocomplete
          options={searchResults}
          getOptionLabel={(option) => option.businessName || option.email}
          loading={searchLoading}
          noOptionsText={searchQuery.length < 3 ? 'Type at least 3 characters' : 'No users found'}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search recipient"
              margin="normal"
              fullWidth
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option._id}>
              <Typography>
                {option.businessName || option.email}
                <Typography component="span" variant="caption" ml={1} color="text.secondary">
                  ({option.role})
                </Typography>
              </Typography>
            </li>
          )}
          onChange={(_, value) => setSelectedRecipient(value)}
          isOptionEqualToValue={(option, value) => option._id === value._id}
        />

        {/* Selected Recipient Display */}
        {selectedRecipient && (
          <Chip
            label={`To: ${selectedRecipient.businessName || selectedRecipient.email}`}
            onDelete={() => setSelectedRecipient(null)}
            sx={{ mb: 2 }}
            color="primary"
          />
        )}

        {/* Message Content */}
        <TextField
          label="Message"
          multiline
          rows={4}
          fullWidth
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={!selectedRecipient}
          sx={{ mt: 1 }}
        />

        {/* Error Display */}
        {error && (
          <Typography color="error" variant="body2" mt={2}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          variant="contained"
          disabled={loading || !selectedRecipient || !content.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Sending...' : 'Send'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}