import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  IconButton
} from '@mui/material';
import useWeb3 from '../hooks/useWeb3';

// Icons would normally be imported from a library like Material Icons
const SwapIcon = () => (
  <Box sx={{ 
    width: 24, 
    height: 24, 
    borderRadius: '50%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    border: '2px solid currentColor'
  }}>
    <span style={{ fontSize: 16 }}>↓</span>
  </Box>
);

interface Token {
  id: string;
  symbol: string;
  name: string;
  balance: string;
  logoUrl: string;
}

const Swap: React.FC = () => {
  const { isConnected } = useWeb3();
  const [fromToken, setFromToken] = useState<string>('ETH');
  const [toToken, setToToken] = useState<string>('AI');
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [swapRate, setSwapRate] = useState<string>('1 ETH = 1000 AI');
  
  // Mock token list - would be fetched from a contract or API
  const tokens: Token[] = [
    { id: '1', symbol: 'ETH', name: 'Ethereum', balance: '2.5', logoUrl: '/icons/eth.png' },
    { id: '2', symbol: 'AI', name: 'AI Token', balance: '10000', logoUrl: '/icons/ai.png' },
    { id: '3', symbol: 'USDT', name: 'Tether USD', balance: '500', logoUrl: '/icons/usdt.png' }
  ];

  const handleFromTokenChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const tokenSymbol = event.target.value as string;
    setFromToken(tokenSymbol);
    updateSwapRate(tokenSymbol, toToken);
  };

  const handleToTokenChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const tokenSymbol = event.target.value as string;
    setToToken(tokenSymbol);
    updateSwapRate(fromToken, tokenSymbol);
  };

  const handleFromAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFromAmount(value);
    // Mock calculation - would use actual exchange rate in real app
    if (fromToken === 'ETH' && toToken === 'AI') {
      setToAmount(parseFloat(value) * 1000 + '');
    } else if (fromToken === 'AI' && toToken === 'ETH') {
      setToAmount(parseFloat(value) / 1000 + '');
    } else {
      setToAmount(value); // 1:1 for simplicity
    }
  };

  const updateSwapRate = (from: string, to: string) => {
    // Mock rates - would use oracle or liquidity pool data in real app
    if (from === 'ETH' && to === 'AI') {
      setSwapRate('1 ETH = 1000 AI');
    } else if (from === 'AI' && to === 'ETH') {
      setSwapRate('1000 AI = 1 ETH');
    } else if (from === 'ETH' && to === 'USDT') {
      setSwapRate('1 ETH = 1800 USDT');
    } else if (from === 'USDT' && to === 'ETH') {
      setSwapRate('1800 USDT = 1 ETH');
    } else if (from === 'AI' && to === 'USDT') {
      setSwapRate('1 AI = 1.8 USDT');
    } else if (from === 'USDT' && to === 'AI') {
      setSwapRate('1.8 USDT = 1 AI');
    } else {
      setSwapRate('1 ' + from + ' = 1 ' + to);
    }
  };

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
    updateSwapRate(toToken, fromToken);
  };

  const handleSwap = () => {
    console.log(`Swapping ${fromAmount} ${fromToken} for ${toAmount} ${toToken}`);
    // Would call contract method here
  };

  const getSelectedTokenBalance = (symbol: string) => {
    const token = tokens.find(t => t.symbol === symbol);
    return token ? token.balance : '0';
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Swap Tokens
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph align="center">
        Exchange tokens at the best rates
      </Typography>
      
      {!isConnected ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            Please connect your wallet to use the swap
          </Typography>
        </Box>
      ) : (
        <Card sx={{ mt: 4, borderRadius: 2, boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            {/* From Token */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">From</Typography>
                <Typography variant="body2">
                  Balance: {getSelectedTokenBalance(fromToken)} {fromToken}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth variant="outlined">
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="number"
                    placeholder="0.0"
                    value={fromAmount}
                    onChange={handleFromAmountChange}
                    sx={{ mb: 2 }}
                  />
                </FormControl>
                
                <FormControl variant="outlined" sx={{ minWidth: 120 }}>
                  <Select
                    value={fromToken}
                    onChange={handleFromTokenChange}
                  >
                    {tokens.map(token => (
                      <MenuItem key={token.id} value={token.symbol}>
                        {token.symbol}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            
            {/* Swap Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <IconButton 
                onClick={handleSwapTokens}
                sx={{ 
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  '&:hover': { bgcolor: 'background.paper' }
                }}
              >
                <SwapIcon />
              </IconButton>
            </Box>
            
            {/* To Token */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">To</Typography>
                <Typography variant="body2">
                  Balance: {getSelectedTokenBalance(toToken)} {toToken}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth variant="outlined">
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="number"
                    placeholder="0.0"
                    value={toAmount}
                    disabled
                    sx={{ mb: 2 }}
                  />
                </FormControl>
                
                <FormControl variant="outlined" sx={{ minWidth: 120 }}>
                  <Select
                    value={toToken}
                    onChange={handleToTokenChange}
                  >
                    {tokens.map(token => (
                      <MenuItem key={token.id} value={token.symbol}>
                        {token.symbol}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            
            {/* Exchange Rate */}
            <Typography 
              variant="body2" 
              color="textSecondary" 
              sx={{ mt: 2, textAlign: 'center' }}
            >
              {swapRate}
            </Typography>
            
            {/* Swap Button */}
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth 
              size="large"
              sx={{ mt: 3, py: 1.5, borderRadius: 2 }}
              onClick={handleSwap}
              disabled={!fromAmount || parseFloat(fromAmount) <= 0}
            >
              Swap
            </Button>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default Swap; 