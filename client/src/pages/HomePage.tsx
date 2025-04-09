import { Typography } from '@mui/material';
import BusinessList from '../components/BusinessList'; // Import BusinessList

export default function HomePage() {
  return (
    <div>
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome to Business Directory
      </Typography>

      <BusinessList /> 
    </div>
  );
}
