import ClearIcon from '@mui/icons-material/Clear';
import SendIcon from '@mui/icons-material/Send';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    IconButton,
    TextField
} from '@mui/material';
import { useState } from 'react';
import { useSocket } from '../hooks/useSocket';
  
  interface MessageResponse {
    status: 'success' | 'error';
    message?: string;
    data?: {
      _id: string;
      conversationId: string;
      sender: {
        _id: string;
        email: string;
      };
      content: string;
      timestamp: string;
      read: boolean;
    };
  }
  
  export function MessageSender({ 
    conversationId 
  }: { 
    conversationId: string 
  }) {
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const socket = useSocket();
  
    const handleSend = () => {
      if (!content.trim()) {
        setError('Message cannot be empty');
        return;
      }
  
      if (!socket?.connected) {
        setError('Connection lost. Please refresh the page.');
        return;
      }
  
      setLoading(true);
      setError('');
  
      socket.emit('sendMessage', { 
        conversationId, 
        content 
      }, (response: MessageResponse) => {
        setLoading(false);
        
        if (response.status === 'success') {
          setContent('');
        } else {
          setError(response.message || 'Failed to send message');
        }
      });
    };
  
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };
  
    const handleClear = () => {
      setContent('');
      setError('');
    };
  
    return (
      <Box sx={{ p: 2, borderTop: '1px solid #eee' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
  
        <TextField
          multiline
          minRows={2}
          maxRows={6}
          fullWidth
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={loading}
          InputProps={{
            endAdornment: content && (
              <IconButton onClick={handleClear} size="small">
                <ClearIcon fontSize="small" />
              </IconButton>
            ),
          }}
        />
  
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={!content.trim() || loading}
            endIcon={
              loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SendIcon />
              )
            }
            sx={{ minWidth: 100 }}
          >
            {loading ? 'Sending' : 'Send'}
          </Button>
        </Box>
      </Box>
    );
  }