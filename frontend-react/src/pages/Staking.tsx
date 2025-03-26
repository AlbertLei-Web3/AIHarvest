import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Slider, 
  Grid, 
  Paper 
} from '@mui/material';
import useWeb3 from '../hooks/useWeb3';

const Staking: React.FC = () => {
  const { isConnected, account } = useWeb3();
  const [stakeAmount, setStakeAmount] = useState<string>('0');
  const [stakePercentage, setStakePercentage] = useState<number>(0);
  const [unstakeAmount, setUnstakeAmount] = useState<string>('0');
  const [unstakePercentage, setUnstakePercentage] = useState<number>(0);
  
  // Mock data - would be replaced with actual contract calls
  const tokenBalance = '1000.00';
  const stakedBalance = '500.00';
  const pendingRewards = '25.50';
  const stakingAPR = '12.5%';

  const handleStakeSliderChange = (event: any, newValue: number | number[]) => {
    const value = newValue as number;
    setStakePercentage(value);
    setStakeAmount(((parseFloat(tokenBalance) * value) / 100).toFixed(2));
  };

  const handleStakeInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setStakeAmount(value);
    const parsedValue = parseFloat(value);
    if (!isNaN(parsedValue) && parseFloat(tokenBalance) > 0) {
      setStakePercentage((parsedValue / parseFloat(tokenBalance)) * 100);
    } else {
      setStakePercentage(0);
    }
  };

  const handleUnstakeSliderChange = (event: any, newValue: number | number[]) => {
    const value = newValue as number;
    setUnstakePercentage(value);
    setUnstakeAmount(((parseFloat(stakedBalance) * value) / 100).toFixed(2));
  };

  const handleUnstakeInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setUnstakeAmount(value);
    const parsedValue = parseFloat(value);
    if (!isNaN(parsedValue) && parseFloat(stakedBalance) > 0) {
      setUnstakePercentage((parsedValue / parseFloat(stakedBalance)) * 100);
    } else {
      setUnstakePercentage(0);
    }
  };

  const handleMaxStake = () => {
    setStakeAmount(tokenBalance);
    setStakePercentage(100);
  };

  const handleMaxUnstake = () => {
    setUnstakeAmount(stakedBalance);
    setUnstakePercentage(100);
  };

  const handleStake = () => {
    console.log(`Staking ${stakeAmount} tokens`);
    // Would call contract method here
  };

  const handleUnstake = () => {
    console.log(`Unstaking ${unstakeAmount} tokens`);
    // Would call contract method here
  };

  const handleHarvest = () => {
    console.log('Harvesting rewards');
    // Would call contract method here
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Staking
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Stake your AI tokens to earn rewards. The longer you stake, the more rewards you'll earn.
      </Typography>
      
      {!isConnected ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            Please connect your wallet to use staking
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {/* Staking Info Card */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Your Staking Info
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <Typography color="textSecondary" variant="body2">
                  Available Balance
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {tokenBalance} AI
                </Typography>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography color="textSecondary" variant="body2">
                  Staked Balance
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {stakedBalance} AI
                </Typography>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography color="textSecondary" variant="body2">
                  Pending Rewards
                </Typography>
                <Typography variant="h6" color="primary" gutterBottom>
                  {pendingRewards} AI
                </Typography>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography color="textSecondary" variant="body2">
                  APR
                </Typography>
                <Typography variant="h6" color="secondary">
                  {stakingAPR}
                </Typography>
              </Box>
              
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                sx={{ mt: 3 }}
                onClick={handleHarvest}
                disabled={parseFloat(pendingRewards) <= 0}
              >
                Harvest Rewards
              </Button>
            </Paper>
          </Grid>
          
          {/* Stake Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Stake Tokens
                </Typography>
                
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">
                      Amount to Stake
                    </Typography>
                    <Button 
                      variant="text" 
                      size="small" 
                      onClick={handleMaxStake}
                      sx={{ minWidth: 'auto', p: 0 }}
                    >
                      MAX
                    </Button>
                  </Box>
                  
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="number"
                    value={stakeAmount}
                    onChange={handleStakeInputChange}
                    margin="normal"
                    InputProps={{
                      endAdornment: <Typography variant="body2">AI</Typography>
                    }}
                  />
                  
                  <Box sx={{ mt: 2 }}>
                    <Slider
                      value={stakePercentage}
                      onChange={handleStakeSliderChange}
                      aria-labelledby="stake-slider"
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${value}%`}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">0%</Typography>
                      <Typography variant="body2" color="textSecondary">100%</Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth 
                  sx={{ mt: 3 }}
                  onClick={handleStake}
                  disabled={parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > parseFloat(tokenBalance)}
                >
                  Stake
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Unstake Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Unstake Tokens
                </Typography>
                
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">
                      Amount to Unstake
                    </Typography>
                    <Button 
                      variant="text" 
                      size="small" 
                      onClick={handleMaxUnstake}
                      sx={{ minWidth: 'auto', p: 0 }}
                    >
                      MAX
                    </Button>
                  </Box>
                  
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="number"
                    value={unstakeAmount}
                    onChange={handleUnstakeInputChange}
                    margin="normal"
                    InputProps={{
                      endAdornment: <Typography variant="body2">AI</Typography>
                    }}
                  />
                  
                  <Box sx={{ mt: 2 }}>
                    <Slider
                      value={unstakePercentage}
                      onChange={handleUnstakeSliderChange}
                      aria-labelledby="unstake-slider"
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${value}%`}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">0%</Typography>
                      <Typography variant="body2" color="textSecondary">100%</Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Button 
                  variant="contained" 
                  color="secondary" 
                  fullWidth 
                  sx={{ mt: 3 }}
                  onClick={handleUnstake}
                  disabled={parseFloat(unstakeAmount) <= 0 || parseFloat(unstakeAmount) > parseFloat(stakedBalance)}
                >
                  Unstake
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default Staking; 