import React, { useState } from 'react';
import { 
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import useWeb3 from '../hooks/useWeb3';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

const AIAssistant: React.FC = () => {
  const { isConnected, account } = useWeb3();
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Hello! I\'m your AI farming assistant. How can I help you today?',
      timestamp: new Date(),
    }
  ]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(input);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiResponse,
        timestamp: new Date(),
      };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    }, 1000);
  };

  const generateAIResponse = (userInput: string): string => {
    const userInputLower = userInput.toLowerCase();
    
    // Mock AI responses based on keywords
    if (userInputLower.includes('apr') || userInputLower.includes('interest')) {
      return 'Our current APR ranges from 5% to 20% depending on the farming pool and lock-up period. The AI-ETH LP pool currently has the highest APR at 18%.';
    } else if (userInputLower.includes('stake') || userInputLower.includes('staking')) {
      return 'To stake your tokens, go to the Staking page, enter the amount you wish to stake, and click on the "Stake" button. Your rewards will start accumulating immediately!';
    } else if (userInputLower.includes('reward') || userInputLower.includes('rewards')) {
      return 'Rewards are distributed in AI tokens and are automatically calculated based on your staked amount and the pool\'s APR. You can harvest your rewards anytime by clicking the "Harvest" button.';
    } else if (userInputLower.includes('farm') || userInputLower.includes('pool')) {
      return 'We currently have three farming pools: ETH-USDT LP Farm (12% APR), AI-ETH LP Farm (18% APR), and Single Asset Staking (8% APR). Each pool has different risk and reward profiles.';
    } else if (userInputLower.includes('strategy') || userInputLower.includes('strategies')) {
      return 'Our AI-powered strategies optimize yields by automatically moving your assets between different protocols based on real-time market conditions. This helps maximize your returns while minimizing risk.';
    } else if (userInputLower.includes('risk') || userInputLower.includes('risks')) {
      return 'All farming activities carry risk. Smart contracts may have vulnerabilities, and token prices can fluctuate. We recommend starting with small amounts and diversifying across different pools.';
    } else if (userInputLower.includes('gas') || userInputLower.includes('fees')) {
      return 'Gas fees vary based on network congestion. For best results, try transacting during off-peak hours. Our platform includes gas optimization to minimize costs when interacting with multiple protocols.';
    } else {
      return 'I\'m not sure I understand your question. Could you try rephrasing it? You can ask me about APRs, staking, rewards, farming pools, our AI strategies, risks, or gas fees.';
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        AI Assistant
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Ask any questions about farming, staking, or our platform. I'm here to help!
      </Typography>
      
      {!isConnected ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            Please connect your wallet to use the AI assistant
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
          <Paper 
            elevation={3} 
            sx={{ 
              flexGrow: 1, 
              mb: 2, 
              p: 2, 
              overflow: 'auto',
              borderRadius: 2
            }}
          >
            <List>
              {messages.map((message, index) => (
                <React.Fragment key={message.id}>
                  <ListItem 
                    alignItems="flex-start"
                    sx={{ 
                      justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                      mb: 1
                    }}
                  >
                    {message.sender === 'ai' && (
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: 'primary.main',
                            width: 40,
                            height: 40
                          }}
                        >
                          AI
                        </Avatar>
                      </ListItemAvatar>
                    )}
                    
                    <Box 
                      sx={{ 
                        maxWidth: '70%',
                        bgcolor: message.sender === 'user' ? 'primary.light' : 'background.paper',
                        color: message.sender === 'user' ? 'white' : 'text.primary',
                        p: 2,
                        borderRadius: 2,
                        boxShadow: 1
                      }}
                    >
                      <Typography variant="body1">{message.text}</Typography>
                      <Typography 
                        variant="caption" 
                        color={message.sender === 'user' ? 'white' : 'text.secondary'}
                        sx={{ display: 'block', mt: 1, textAlign: 'right' }}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                    
                    {message.sender === 'user' && (
                      <ListItemAvatar sx={{ ml: 1 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: 'secondary.main',
                            width: 40,
                            height: 40
                          }}
                        >
                          {account?.substring(0, 2)}
                        </Avatar>
                      </ListItemAvatar>
                    )}
                  </ListItem>
                  {index < messages.length - 1 && (
                    <Box sx={{ my: 1 }}>
                      <Divider variant="fullWidth" />
                    </Box>
                  )}
                </React.Fragment>
              ))}
            </List>
          </Paper>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your question here..."
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              multiline
              rows={2}
              sx={{ borderRadius: 2 }}
            />
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSendMessage}
              disabled={!input.trim()}
              sx={{ 
                px: 3, 
                alignSelf: 'stretch',
                borderRadius: 2
              }}
            >
              Send
            </Button>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default AIAssistant; 