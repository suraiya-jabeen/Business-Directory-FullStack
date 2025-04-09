import { Close, Search, Send } from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  TextField,
  Typography
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api, { searchUsers } from '../services/api';

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  senderEmail?: string;
  receiverEmail?: string;
  read?: boolean;
}

interface UserResult {
  _id: string;
  email: string;
  role: string;
  businessName?: string;
}

export default function MessageInbox() {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<UserResult | null>(null);
  const [loading, setLoading] = useState({
    messages: false,
    send: false,
    search: false
  });
  const [error, setError] = useState('');

  const fetchMessages = useCallback(async () => {
    if (!user?.token) return;
    
    setLoading(prev => ({ ...prev, messages: true }));
    setError('');
    
    try {
      const response = await api.get('/messages', {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      setMessages(response.data);
    } catch (error: unknown) {
      console.error('Failed to fetch messages:', error);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, messages: false }));
    }
  }, [user?.token]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

// MessageInbox.tsx
const handleSearch = async (query: string) => {
  try {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    const results = await searchUsers(query);
    setSearchResults(results);
  } catch (error) {
    console.error('Search error:', error);
    toast.error('Failed to search users', { position: 'top-right' });
    toast.error('Failed to search users');
    setSearchResults([]);
  }
};

  const handleSend = useCallback(async () => {
    if (!user?.token || !selectedRecipient || !messageContent.trim()) {
      setError(!user?.token ? 'Please log in' : 
              !selectedRecipient ? 'Select a recipient' : 
              'Message cannot be empty');
      return;
    }

    setLoading(prev => ({ ...prev, send: true }));
    setError('');

    try {
      await api.post('/messages/send', {
        receiverId: selectedRecipient._id,
        content: messageContent.trim()
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      // Optimistic update
      setMessages(prev => [{
        _id: Date.now().toString(), // Temporary ID
        senderId: user._id,
        receiverId: selectedRecipient._id,
        content: messageContent.trim(),
        timestamp: new Date(),
        senderEmail: user.email,
        receiverEmail: selectedRecipient.email
      }, ...prev]);

      handleClose();
      fetchMessages(); // Refresh full list from server
    } catch (error: any) {
      console.error('Message send error:', error);
      const errorMsg = error.response?.data?.message || 
                      error.message || 
                      'Failed to send message';
      setError(errorMsg);

      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(prev => ({ ...prev, send: false }));
    }
  }, [user, selectedRecipient, messageContent, fetchMessages, logout]);

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedRecipient(null);
    setMessageContent('');
    setError('');
    setComposerOpen(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ p: 4, maxWidth: 'md', mx: 'auto' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4
      }}>
        <Typography variant="h4" component="h1">
          Messages
        </Typography>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={() => setComposerOpen(true)}
          disabled={loading.messages}
        >
          New Message
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading.messages ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : messages.length === 0 ? (
        <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
          No messages found. Start a conversation!
        </Typography>
      ) : (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
          {messages.map((msg) => (
            <ListItem 
              key={msg._id} 
              alignItems="flex-start"
              sx={{
                bgcolor: msg.read ? 'inherit' : 'action.hover',
                '&:hover': { bgcolor: 'action.selected' }
              }}
            >
              <ListItemAvatar>
                <Avatar>
                  {msg.senderId === user?._id ? 
                    msg.receiverEmail?.charAt(0).toUpperCase() : 
                    msg.senderEmail?.charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" fontWeight={msg.read ? 'normal' : 'bold'}>
                      {msg.senderId === user?._id ? 
                        `To: ${msg.receiverEmail}` : 
                        `From: ${msg.senderEmail}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(msg.timestamp)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography 
                    component="span" 
                    variant="body2" 
                    color="text.primary"
                    fontWeight={msg.read ? 'normal' : 'medium'}
                  >
                    {msg.content}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      <Dialog 
        open={composerOpen} 
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>New Message</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Search recipient"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <IconButton 
                  onClick={() => setSearchQuery('')}
                  edge="end"
                >
                  <Close fontSize="small" />
                </IconButton>
              )
            }}
          />

          {loading.search && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {searchResults.length > 0 && (
            <List sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
              {searchResults.map((result) => (
                <ListItemButton
                  key={result._id}
                  onClick={() => {
                    setSelectedRecipient(result);
                    setSearchQuery(result.businessName || result.email);
                    setSearchResults([]);
                  }}
                >
                  <ListItemText
                    primary={result.businessName || result.email}
                    secondary={result.role}
                  />
                </ListItemButton>
              ))}
            </List>
          )}

          {selectedRecipient && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                To: {selectedRecipient.businessName || selectedRecipient.email}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                label="Message"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                disabled={loading.send}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading.send}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={!selectedRecipient || !messageContent.trim() || loading.send}
            startIcon={loading.send ? <CircularProgress size={20} /> : <Send />}
          >
            {loading.send ? 'Sending...' : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}