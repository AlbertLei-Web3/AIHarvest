import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8, textAlign: 'center' }}>
      <Typography variant="h1" component="h1" gutterBottom sx={{ fontSize: { xs: '3rem', md: '4rem' } }}>
        404
      </Typography>
      
      <Typography variant="h4" component="h2" gutterBottom>
        Page Not Found
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        The page you are looking for doesn't exist or has been moved.
      </Typography>
      
      <Box 
        sx={{ 
          mt: 4, 
          p: 4, 
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: 2,
          maxWidth: 500,
          mx: 'auto'
        }}
      >
        <Typography variant="body1" paragraph>
          You might want to check out these pages instead:
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 300, mx: 'auto' }}>
          <Button component={Link} to="/" variant="contained" color="primary" fullWidth>
            Home
          </Button>
          <Button component={Link} to="/farms" variant="outlined" color="primary" fullWidth>
            Farms
          </Button>
          <Button component={Link} to="/staking" variant="outlined" color="primary" fullWidth>
            Staking
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ mt: 8 }}>
        <Typography variant="body2" color="textSecondary">
          If you think this is an error, please contact support.
        </Typography>
      </Box>
    </Container>
  );
};

export default NotFound; 