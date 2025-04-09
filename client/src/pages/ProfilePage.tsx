import { CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    // While loading, show a spinner
    return (
      <div className="p-4">
        <Typography variant="h4" gutterBottom>
          User Profile
        </Typography>
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="p-4">
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>
      {user ? (
        <>
          <Typography>Email: {user.email}</Typography>
          <Typography>Role: {user.role}</Typography>
        </>
      ) : (
        <Typography>No user information available. Please log in.</Typography>
      )}
    </div>
  );
}
