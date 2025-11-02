import { useState } from 'react'
import {
  Box,
  Fab,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Zoom,
  Chip,
} from '@mui/material'
import {
  SmartToy as SmartToyIcon,
  Close as CloseIcon,
  Send as SendIcon,
} from '@mui/icons-material'
import { palette, gradients, shadows } from '../theme'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

const quickSuggestions = [
  'What documents do I need?',
  'How long does processing take?',
  'Can I edit my request?',
  'Track my request status',
]

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm your AI assistant. How can I help you with your request today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleSend = () => {
    if (!message.trim()) return

    const userMessage: Message = {
      id: messages.length + 1,
      text: message,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages([...messages, userMessage])
    setMessage('')

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: getBotResponse(message),
        sender: 'bot',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botResponse])
    }, 1000)
  }

  const getBotResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase()
    
    if (msg.includes('document')) {
      return 'For most requests, you\'ll need: 1) Valid student ID, 2) Supporting documents (transcripts, letters, etc.), and 3) Any relevant forms. The specific requirements are shown in each step.'
    } else if (msg.includes('long') || msg.includes('time') || msg.includes('processing')) {
      return 'Processing time varies by request type: Grade appeals take 5-7 days, document requests 2-3 days, and course registrations are processed within 24 hours. You\'ll receive email updates at each stage.'
    } else if (msg.includes('edit')) {
      return 'Yes! You can edit your request while it\'s in "pending" or "draft" status. Once it\'s been reviewed or approved, you\'ll need to submit a new request with changes.'
    } else if (msg.includes('track') || msg.includes('status')) {
      return 'You can track your request status from the "My Requests" page. Click on any request to see detailed status updates, timeline, and any messages from administrators.'
    } else if (msg.includes('help') || msg.includes('hi') || msg.includes('hello')) {
      return 'I can help you with document requirements, processing times, editing requests, and tracking status. What would you like to know?'
    } else {
      return 'I\'m here to help! You can ask me about required documents, processing times, editing your request, or tracking status. What specific question do you have?'
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion)
  }

  return (
    <>
      {/* Chat Window */}
      <Zoom in={isOpen}>
        <Paper
          sx={{
            position: 'fixed',
            bottom: 100,
            right: 24,
            width: { xs: 'calc(100% - 48px)', sm: 380 },
            height: 500,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: shadows.xl,
            zIndex: 1300,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: gradients.primary,
              color: palette.offWhite,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: palette.offWhite, color: palette.oliveGreenDark }}>
                <SmartToyIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  AI Assistant
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Always here to help
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={handleToggle} sx={{ color: palette.offWhite }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 2,
              bgcolor: 'background.default',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            {messages.map((msg) => (
              <Box
                key={msg.id}
                sx={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <Paper
                  sx={{
                    p: 1.5,
                    maxWidth: '75%',
                    bgcolor: msg.sender === 'user' ? palette.oliveGreen : 'background.paper',
                    color: msg.sender === 'user' ? palette.offWhite : 'text.primary',
                    borderRadius: 2,
                    boxShadow: shadows.sm,
                  }}
                >
                  <Typography variant="body2">{msg.text}</Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 0.5,
                      display: 'block',
                      opacity: 0.7,
                      fontSize: '0.7rem',
                    }}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Paper>
              </Box>
            ))}

            {/* Quick Suggestions */}
            {messages.length === 1 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Quick questions:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {quickSuggestions.map((suggestion, index) => (
                    <Chip
                      key={index}
                      label={suggestion}
                      size="small"
                      onClick={() => handleSuggestionClick(suggestion)}
                      sx={{
                        bgcolor: palette.oliveGreenLight,
                        color: palette.darkBrown,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: palette.oliveGreen,
                          color: palette.offWhite,
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* Input */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Type your question..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSend()
                  }
                }}
              />
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={!message.trim()}
                sx={{
                  bgcolor: palette.oliveGreen,
                  color: palette.offWhite,
                  '&:hover': {
                    bgcolor: palette.oliveGreenDark,
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'action.disabledBackground',
                  },
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Zoom>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: gradients.primary,
          zIndex: 1300,
          '&:hover': {
            background: palette.oliveGreenDark,
          },
        }}
        onClick={handleToggle}
      >
        <SmartToyIcon />
      </Fab>
    </>
  )
}
