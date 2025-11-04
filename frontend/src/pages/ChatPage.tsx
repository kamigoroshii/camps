import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Avatar,
  CircularProgress,
  Chip,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stack,
  Card,
  CardContent,
} from '@mui/material'
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  Android as AIIcon,
  Person as PersonIcon,
  Description as DocumentIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import api from '../services/api'
import { palette, gradients } from '../theme'
import { useAuthStore } from '../stores/authStore'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: any[]
}

interface Document {
  filename: string
  upload_date: string
  chunks_count: number
  file_type: string
}

export default function ChatPage() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I can help you with information from your uploaded documents. Upload documents or ask me anything!',
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const response = await api.get('/rag/documents', {
        params: { user_id: user?.id, limit: 100 },
      })
      setDocuments(response.data.documents || [])
    } catch (error) {
      console.error('Failed to load documents:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await api.post('/rag/chat', {
        message: inputMessage,
        language: 'english',
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        sources: response.data.sources || [],
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to get response')
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUploadDocument = async () => {
    if (!selectedFile || isUploadingDoc) return

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('user_id', user?.id?.toString() || 'anonymous')

    setIsUploadingDoc(true)

    try {
      const response = await api.post('/rag/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      toast.success(`Document uploaded: ${response.data.chunks_created} chunks created`)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      loadDocuments()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to upload document')
    } finally {
      setIsUploadingDoc(false)
    }
  }

  const handleDeleteDocument = async (filename: string) => {
    if (!window.confirm(`Delete ${filename}?`)) return

    try {
      await api.delete(`/rag/documents/${filename}`, {
        params: { user_id: user?.id },
      })
      toast.success('Document deleted')
      loadDocuments()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete document')
    }
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', p: 0, m: 0 }}>
      {/* Main Chat Area - Full Width */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: palette.gray50,
          minWidth: 0,
        }}
      >
        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: { xs: 1, sm: 3 },
          }}
        >
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  maxWidth: '70%',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: message.role === 'user' ? palette.primary : palette.secondary,
                    width: 40,
                    height: 40,
                  }}
                >
                  {message.role === 'user' ? <PersonIcon /> : <AIIcon />}
                </Avatar>
                <Box>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: message.role === 'user' ? palette.primary : palette.white,
                      color: message.role === 'user' ? palette.white : palette.textPrimary,
                      borderRadius: 2,
                      boxShadow: 1,
                      '& h1, & h2, & h3, & h4, & h5, & h6': {
                        marginTop: '16px',
                        marginBottom: '8px',
                        fontWeight: 600,
                      },
                      '& h2': {
                        fontSize: '1.5rem',
                        borderBottom: '2px solid #e0e0e0',
                        paddingBottom: '4px',
                      },
                      '& h3': {
                        fontSize: '1.25rem',
                      },
                      '& p': {
                        marginBottom: '8px',
                      },
                      '& ul, & ol': {
                        marginLeft: '20px',
                        marginBottom: '12px',
                      },
                      '& blockquote': {
                        borderLeft: '4px solid #0891b2',
                        paddingLeft: '12px',
                        marginLeft: '0',
                        fontStyle: 'italic',
                        backgroundColor: '#f5f5f5',
                        padding: '8px 12px',
                        borderRadius: '4px',
                      },
                      '& code': {
                        backgroundColor: '#f5f5f5',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                      },
                      '& pre': {
                        backgroundColor: '#f5f5f5',
                        padding: '12px',
                        borderRadius: '4px',
                        overflow: 'auto',
                      },
                    }}
                  >
                    {message.role === 'user' ? (
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </Typography>
                    ) : (
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => <Typography variant="h4" component="h1" gutterBottom>{children}</Typography>,
                          h2: ({ children }) => <Typography variant="h5" component="h2" gutterBottom>{children}</Typography>,
                          h3: ({ children }) => <Typography variant="h6" component="h3" gutterBottom>{children}</Typography>,
                          p: ({ children }) => <Typography variant="body1" paragraph>{children}</Typography>,
                          li: ({ children }) => <Typography component="li" variant="body2">{children}</Typography>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </Box>
                  {message.sources && message.sources.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Sources:
                      </Typography>
                      {message.sources.slice(0, 3).map((source: any, idx: number) => (
                        <Chip
                          key={idx}
                          label={source.filename || `Source ${idx + 1}`}
                          size="small"
                          icon={<DocumentIcon />}
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {message.timestamp.toLocaleTimeString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: palette.secondary }}>
                  <AIIcon />
                </Avatar>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: palette.white }}>
                  <CircularProgress size={20} />
                </Box>
              </Box>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box sx={{ p: 2, bgcolor: palette.white, borderTop: `1px solid ${palette.borderLight}` }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your documents..."
              disabled={isLoading}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              sx={{
                minWidth: 56,
                height: 56,
                borderRadius: 2,
              }}
            >
              <SendIcon />
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Sidebar - Documents */}
      <Box
        sx={{
          width: 320,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: `1px solid ${palette.borderLight}`,
          bgcolor: palette.backgroundSubtle,
        }}
      >
        <Box
          sx={{
            p: 2,
            bgcolor: palette.primary,
            color: palette.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Documents ({documents.length})
          </Typography>
          <IconButton onClick={loadDocuments} size="small" sx={{ color: palette.white }}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* Upload Area */}
        <Box sx={{ p: 2 }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.jpg,.jpeg,.png"
          />
          {selectedFile ? (
            <Card sx={{ mb: 1 }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                    <DocumentIcon fontSize="small" />
                    <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                      {selectedFile.name}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ) : null}
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => fileInputRef.current?.click()}
              startIcon={<AttachFileIcon />}
              disabled={isUploadingDoc}
            >
              Select File
            </Button>
            <Button
              variant="contained"
              onClick={handleUploadDocument}
              disabled={!selectedFile || isUploadingDoc}
              startIcon={isUploadingDoc ? <CircularProgress size={16} /> : <UploadIcon />}
            >
              Upload
            </Button>
          </Stack>
        </Box>

        <Divider />

        {/* Documents List */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {documents.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No documents uploaded yet. Upload documents to start chatting!
            </Alert>
          ) : (
            <List dense>
              {documents.map((doc, index) => (
                <ListItem
                  key={index}
                  sx={{
                    mb: 1,
                    bgcolor: palette.white,
                    borderRadius: 1,
                    border: `1px solid ${palette.borderLight}`,
                  }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleDeleteDocument(doc.filename)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <DocumentIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" noWrap>
                        {doc.filename}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {doc.chunks_count || 0} chunks • {doc.file_type}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Box>
    </Box>
  )
}
