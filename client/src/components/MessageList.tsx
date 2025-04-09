import {
  Avatar,
  Badge,
  Box,
  Chip,
  Divider,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Skeleton,
  Typography,
  useTheme
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';

interface Participant {
  _id: string;
  email: string;
  role: string;
  businessName?: string;
  avatar?: string;
}

interface Message {
  _id: string;
  sender: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

interface Conversation {
  _id: string;
  participants: Participant[];
  messages: Message[];
  lastActive: Date;
  unreadCount?: number;
}

interface MessageListProps {
  conversations: Conversation[];
  loading?: boolean;
  onConversationClick?: (conversationId: string) => void;
  selectedConversation?: string | null;
}

export default function MessageList({ 
  conversations, 
  loading = false,
  onConversationClick, 
  selectedConversation 
}: MessageListProps) {
  const { user } = useAuth();
  const theme = useTheme();

  if (loading) {
    return (
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {[...Array(5)].map((_, index) => (
          <div key={index}>
            <ListItemButton>
              <ListItemAvatar>
                <Skeleton variant="circular" width={40} height={40} />
              </ListItemAvatar>
              <ListItemText
                primary={<Skeleton variant="text" width="60%" />}
                secondary={<Skeleton variant="text" width="40%" />}
              />
            </ListItemButton>
            <Divider variant="inset" component="li" />
          </div>
        ))}
      </List>
    );
  }

  if (!conversations.length) {
    return (
      <Typography 
        variant="body1" 
        color="text.secondary" 
        align="center" 
        sx={{ p: 4 }}
      >
        No conversations found. Start a new conversation!
      </Typography>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {conversations.map((conversation) => {
        const otherParticipant = conversation.participants.find(
          (participant) => participant._id !== user?._id
        );
        
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        const unreadCount = conversation.messages.filter(
          (msg) => !msg.read && msg.sender !== user?._id
        ).length;

        const isSelected = selectedConversation === conversation._id;

        return (
          <div key={conversation._id}>
            <ListItemButton
              alignItems="flex-start"
              onClick={() => onConversationClick?.(conversation._id)}
              selected={isSelected}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: theme.palette.action.selected,
                  '&:hover': {
                    backgroundColor: theme.palette.action.selected
                  }
                }
              }}
            >
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={unreadCount > 0 ? (
                    <Chip 
                      label={unreadCount} 
                      size="small" 
                      color="primary"
                      sx={{ 
                        height: 20, 
                        minWidth: 20,
                        '& .MuiChip-label': {
                          px: 0.5
                        }
                      }}
                    />
                  ) : null}
                >
                  <Avatar 
                    sx={{ 
                      bgcolor: theme.palette.primary.main,
                      width: 40,
                      height: 40
                    }}
                    src={otherParticipant?.avatar}
                  >
                    {otherParticipant?.businessName?.charAt(0)?.toUpperCase() || 
                     otherParticipant?.email?.charAt(0)?.toUpperCase() || '?'}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box
                    component="div"
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Typography 
                      variant="subtitle1" 
                      component="span"
                      fontWeight={unreadCount > 0 ? 'bold' : 'normal'}
                    >
                      {otherParticipant?.businessName || otherParticipant?.email}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="span"
                    >
                      {formatDistanceToNow(new Date(conversation.lastActive), { addSuffix: true })}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontWeight: unreadCount > 0 ? 'medium' : 'normal'
                    }}
                  >
                    {lastMessage?.content || 'No messages yet'}
                  </Typography>
                }
                sx={{ my: 0 }}
              />
            </ListItemButton>
            <Divider variant="inset" component="li" />
          </div>
        );
      })}
    </List>
  );
}