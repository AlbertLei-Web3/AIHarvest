import React, { useEffect, useState } from 'react';
import { Container, Grid, Typography, Box, Card, CardContent, Button, CircularProgress } from '@mui/material';
import useWeb3 from '../hooks/useWeb3';
import useContracts from '../hooks/useContracts';

interface Farm {
  id: string;
  name: string;
  stakingToken: string;
  rewardToken: string;
  totalStaked: string;
  apr: string;
}

const Farms: React.FC = () => {
  const { isConnected } = useWeb3();
  const { factory, getStakingTokenSymbol, getRewardTokenSymbol } = useContracts();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        if (factory) {
          setLoading(true);
          // Placeholder for real contract calls
          // This would be replaced with actual contract interaction
          const mockFarms: Farm[] = [
            {
              id: '1',
              name: 'ETH-USDT LP Farm',
              stakingToken: 'LP-ETH-USDT',
              rewardToken: 'AI',
              totalStaked: '1,234,567',
              apr: '12%'
            },
            {
              id: '2',
              name: 'AI-ETH LP Farm',
              stakingToken: 'LP-AI-ETH',
              rewardToken: 'AI',
              totalStaked: '897,654',
              apr: '18%'
            },
            {
              id: '3',
              name: 'Single Asset Staking',
              stakingToken: 'AI',
              rewardToken: 'AI',
              totalStaked: '567,890',
              apr: '8%'
            }
          ];
          
          setFarms(mockFarms);
        }
      } catch (error) {
        console.error('Error fetching farms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFarms();
  }, [factory, getStakingTokenSymbol, getRewardTokenSymbol]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Farming Pools
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Stake your tokens in our farms to earn AI rewards. The higher the APR, the more rewards you'll earn!
      </Typography>
      
      {!isConnected ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            Please connect your wallet to view available farms
          </Typography>
        </Box>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {farms.map((farm) => (
            <Grid item xs={12} md={4} key={farm.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 2,
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {farm.name}
                  </Typography>
                  
                  <Box sx={{ my: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Staking Token: <strong>{farm.stakingToken}</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Reward Token: <strong>{farm.rewardToken}</strong>
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 2 }}>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Total Staked
                      </Typography>
                      <Typography variant="h6">
                        {farm.totalStaked}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        APR
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {farm.apr}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      fullWidth
                      sx={{ mb: 1 }}
                    >
                      Stake
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      fullWidth
                    >
                      Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Farms; 