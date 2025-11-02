import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  TextField,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  AttachFile as AttachFileIcon,
  Send as SendIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material'
import { palette, gradients, shadows } from '../theme'
import { toast } from 'react-toastify'

// Mock data for the request
interface TimelineEvent {
  id: number
  status: string
  timestamp: string
  actor: string
  comment?: string
  documents?: string[]
}

interface RequestDocument {
  id: number
  name: string
  size: string
  uploadedAt: string
  type: string
  url?: string
  isApproved?: boolean
}

interface ChatMessage {
  id: number
  sender: string
  senderRole: 'user' | 'admin'
  message: string
  timestamp: string
  avatar?: string
}

interface RequestDetails {
  id: string
  title: string
  type: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  description: string
  requestedBy: string
  assignedTo: string
  estimatedCompletion: string
  documents: RequestDocument[]
  timeline: TimelineEvent[]
  chatMessages: ChatMessage[]
}

// Mock data generator
const getMockRequestData = (id: string): RequestDetails => ({
  id,
  title: 'Student Visa Extension Request',
  type: 'Visa Processing',
  status: 'In Progress',
  priority: 'High',
  createdAt: '2024-01-15',
  updatedAt: '2024-01-22',
  description:
    'Request for extending student visa for the upcoming academic year. Current visa expires on March 31, 2024. Need extension for continued enrollment in the Computer Science program.',
  requestedBy: 'John Doe',
  assignedTo: 'Admin Sarah Johnson',
  estimatedCompletion: '2024-02-15',
  documents: [
    {
      id: 1,
      name: 'Passport_Copy.pdf',
      size: '2.3 MB',
      uploadedAt: '2024-01-15',
      type: 'pdf',
      isApproved: true,
    },
    {
      id: 2,
      name: 'Current_Visa.pdf',
      size: '1.8 MB',
      uploadedAt: '2024-01-15',
      type: 'pdf',
      isApproved: true,
    },
    {
      id: 3,
      name: 'Enrollment_Letter.pdf',
      size: '890 KB',
      uploadedAt: '2024-01-16',
      type: 'pdf',
      isApproved: false,
    },
    {
      id: 4,
      name: 'Financial_Statement.pdf',
      size: '1.2 MB',
      uploadedAt: '2024-01-18',
      type: 'pdf',
      isApproved: true,
    },
  ],
  timeline: [
    {
      id: 1,
      status: 'Submitted',
      timestamp: '2024-01-15 09:30 AM',
      actor: 'John Doe',
      comment: 'Initial request submitted with all required documents.',
    },
    {
      id: 2,
      status: 'Under Review',
      timestamp: '2024-01-16 02:15 PM',
      actor: 'Admin Sarah Johnson',
      comment: 'Request assigned and initial review started.',
    },
    {
      id: 3,
      status: 'Documents Verified',
      timestamp: '2024-01-18 11:45 AM',
      actor: 'Admin Sarah Johnson',
      comment: 'Passport and current visa verified. Financial statement approved.',
      documents: ['Passport_Copy.pdf', 'Current_Visa.pdf', 'Financial_Statement.pdf'],
    },
    {
      id: 4,
      status: 'In Progress',
      timestamp: '2024-01-22 03:20 PM',
      actor: 'Admin Sarah Johnson',
      comment: 'Processing visa extension. Awaiting response from immigration office.',
    },
  ],
  chatMessages: [
    {
      id: 1,
      sender: 'John Doe',
      senderRole: 'user',
      message: 'Hello, I submitted my visa extension request. When can I expect an update?',
      timestamp: '2024-01-17 10:30 AM',
    },
    {
      id: 2,
      sender: 'Admin Sarah Johnson',
      senderRole: 'admin',
      message:
        'Hello John! Your request is under review. We are currently verifying your documents. You should receive an update within 2-3 business days.',
      timestamp: '2024-01-17 02:45 PM',
      avatar: 'SJ',
    },
    {
      id: 3,
      sender: 'John Doe',
      senderRole: 'user',
      message: 'Thank you! Do I need to provide any additional documents?',
      timestamp: '2024-01-17 03:00 PM',
    },
    {
      id: 4,
      sender: 'Admin Sarah Johnson',
      senderRole: 'admin',
      message:
        'Your enrollment letter needs to be updated with the current semester information. Please upload a new version from the registrar.',
      timestamp: '2024-01-18 09:15 AM',
      avatar: 'SJ',
    },
    {
      id: 5,
      sender: 'John Doe',
      senderRole: 'user',
      message: 'Got it! I will upload the updated enrollment letter today.',
      timestamp: '2024-01-18 10:00 AM',
    },
  ],
})

const getStatusColor = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'Submitted': palette.info,
    'Under Review': palette.warning,
    'Documents Verified': palette.primary,
    'In Progress': palette.primaryDark,
    'Approved': palette.success,
    'Completed': palette.primary,
    'Rejected': palette.error,
    'Needs Action': palette.warning,
  }
  return statusMap[status] || palette.gray500
}

const getStatusIcon = (status: string) => {
  const iconMap: { [key: string]: JSX.Element } = {
    'Submitted': <DescriptionIcon />,
    'Under Review': <ScheduleIcon />,
    'Documents Verified': <CheckCircleIcon />,
    'In Progress': <HourglassEmptyIcon />,
    'Approved': <CheckCircleIcon />,
    'Completed': <CheckCircleIcon />,
    'Rejected': <CancelIcon />,
    'Needs Action': <EditIcon />,
  }
  return iconMap[status] || <ScheduleIcon />
}

export default function RequestDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [requestData] = useState<RequestDetails>(getMockRequestData(id || '1'))
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(requestData.chatMessages)
  const [previewDocument, setPreviewDocument] = useState<RequestDocument | null>(null)

  useEffect(() => {
    // Auto-scroll to bottom of chat
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage: ChatMessage = {
        id: chatMessages.length + 1,
        sender: 'John Doe',
        senderRole: 'user',
        message: chatMessage,
        timestamp: new Date().toLocaleString(),
      }
      setChatMessages([...chatMessages, newMessage])
      setChatMessage('')
      toast.success('Message sent!')

      // Simulate admin response after 2 seconds
      setTimeout(() => {
        const adminResponse: ChatMessage = {
          id: chatMessages.length + 2,
          sender: 'Admin Sarah Johnson',
          senderRole: 'admin',
          message: 'Thank you for your message. I will look into this and get back to you shortly.',
          timestamp: new Date().toLocaleString(),
          avatar: 'SJ',
        }
        setChatMessages((prev) => [...prev, adminResponse])
      }, 2000)
    }
  }

  const handleDownloadDocument = (doc: RequestDocument) => {
    if (!doc.isApproved) {
      toast.warning('This document is pending approval and cannot be downloaded yet.')
      return
    }
    // Simulate download
    toast.success(`Downloading ${doc.name}...`)
    console.log('Downloading:', doc.name)
  }

  const handlePreviewDocument = (doc: RequestDocument) => {
    setPreviewDocument(doc)
  }

  const handleClosePreview = () => {
    setPreviewDocument(null)
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/requests')}
          sx={{
            mb: 2,
            color: palette.primary,
            '&:hover': { bgcolor: 'rgba(99, 107, 47, 0.1)' },
          }}
        >
          Back to Requests
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: palette.primary }}>
            {requestData.title}
          </Typography>
          <Chip
            label={requestData.status}
            sx={{
              bgcolor: getStatusColor(requestData.status),
              color: 'white',
              fontWeight: 600,
            }}
          />
          <Chip
            label={`Priority: ${requestData.priority}`}
            variant="outlined"
            sx={{
              borderColor: requestData.priority === 'High' ? palette.error : palette.gray500,
              color: requestData.priority === 'High' ? palette.error : palette.gray500,
            }}
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Request Details & Timeline */}
        <Grid item xs={12} lg={8}>
          {/* Request Overview */}
          <Paper sx={{ p: 3, mb: 3, boxShadow: shadows.md }}>
            <Typography variant="h6" sx={{ mb: 2, color: palette.primary, fontWeight: 600 }}>
              Request Overview
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Request Type
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {requestData.type}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Request ID
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  #{requestData.id}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Requested By
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {requestData.requestedBy}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Assigned To
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {requestData.assignedTo}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Created Date
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {new Date(requestData.createdAt).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Estimated Completion
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {new Date(requestData.estimatedCompletion).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, lineHeight: 1.6 }}>
                  {requestData.description}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Visual Timeline */}
          <Paper sx={{ p: 3, mb: 3, boxShadow: shadows.md }}>
            <Typography variant="h6" sx={{ mb: 3, color: palette.primary, fontWeight: 600 }}>
              Request Timeline
            </Typography>

            <Stepper orientation="vertical" activeStep={requestData.timeline.length}>
              {requestData.timeline.map((event) => (
                <Step key={event.id} expanded>
                  <StepLabel
                    StepIconComponent={() => (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: getStatusColor(event.status),
                          color: 'white',
                        }}
                      >
                        {getStatusIcon(event.status)}
                      </Box>
                    )}
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontWeight: 600,
                        fontSize: '1rem',
                        color: palette.darkBrown,
                      },
                    }}
                  >
                    {event.status}
                  </StepLabel>
                  <StepContent>
                    <Box sx={{ pb: 3 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {event.timestamp} • {event.actor}
                      </Typography>
                      {event.comment && (
                        <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
                          {event.comment}
                        </Typography>
                      )}
                      {event.documents && event.documents.length > 0 && (
                        <Alert
                          severity="success"
                          icon={<CheckCircleIcon />}
                          sx={{ bgcolor: 'rgba(107, 142, 35, 0.1)' }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Documents Verified:
                          </Typography>
                          <Box component="ul" sx={{ m: 0, pl: 2 }}>
                            {event.documents.map((doc, idx) => (
                              <li key={idx}>
                                <Typography variant="body2">{doc}</Typography>
                              </li>
                            ))}
                          </Box>
                        </Alert>
                      )}
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>

            {requestData.status !== 'Completed' && requestData.status !== 'Rejected' && (
              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  Your request is currently being processed. You will be notified of any updates.
                </Typography>
              </Alert>
            )}
          </Paper>

          {/* Documents Section */}
          <Paper sx={{ p: 3, boxShadow: shadows.md }}>
            <Typography variant="h6" sx={{ mb: 2, color: palette.primary, fontWeight: 600 }}>
              Attached Documents
            </Typography>

            <Grid container spacing={2}>
              {requestData.documents.map((doc) => (
                <Grid item xs={12} sm={6} key={doc.id}>
                  <Card
                    sx={{
                      border: `1px solid ${palette.gray300}`,
                      '&:hover': { boxShadow: shadows.sm },
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: gradients.primaryLight,
                          }}
                        >
                          <DescriptionIcon sx={{ color: palette.primary }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {doc.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {doc.size} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip
                              label={doc.isApproved ? 'Approved' : 'Pending Review'}
                              size="small"
                              sx={{
                                bgcolor: doc.isApproved ? palette.success : palette.warning,
                                color: 'white',
                                fontSize: '0.7rem',
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Tooltip title="Preview Document">
                          <IconButton
                            size="small"
                            onClick={() => handlePreviewDocument(doc)}
                            sx={{
                              color: palette.primary,
                              '&:hover': { bgcolor: 'rgba(99, 107, 47, 0.1)' },
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={doc.isApproved ? 'Download' : 'Pending Approval'}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadDocument(doc)}
                              disabled={!doc.isApproved}
                              sx={{
                                color: palette.primary,
                                '&:hover': { bgcolor: 'rgba(99, 107, 47, 0.1)' },
                                '&.Mui-disabled': { color: palette.gray400 },
                              }}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Alert severity="info" icon={<AttachFileIcon />} sx={{ mt: 3 }}>
              <Typography variant="body2">
                Documents marked as "Approved" are available for download. Pending documents will be
                available once verified by the admin.
              </Typography>
            </Alert>
          </Paper>
        </Grid>

        {/* Right Column - Chat */}
        <Grid item xs={12} lg={4}>
          <Paper
            sx={{
              height: { xs: '500px', lg: 'calc(100vh - 180px)' },
              display: 'flex',
              flexDirection: 'column',
              boxShadow: shadows.md,
              position: 'sticky',
              top: 20,
            }}
          >
            {/* Chat Header */}
            <Box
              sx={{
                p: 2,
                background: gradients.primary,
                color: 'white',
                borderTopLeftRadius: 1,
                borderTopRightRadius: 1,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Admin Communication
              </Typography>
              <Typography variant="caption">
                Chat with your assigned administrator
              </Typography>
            </Box>

            {/* Chat Messages */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
                bgcolor: palette.offWhite,
              }}
            >
              <List sx={{ p: 0 }}>
                {chatMessages.map((msg) => (
                  <ListItem
                    key={msg.id}
                    sx={{
                      flexDirection: 'column',
                      alignItems: msg.senderRole === 'user' ? 'flex-end' : 'flex-start',
                      mb: 2,
                      p: 0,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        maxWidth: '85%',
                        flexDirection: msg.senderRole === 'user' ? 'row-reverse' : 'row',
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 0 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor:
                              msg.senderRole === 'admin' ? palette.primary : palette.primaryDark,
                            fontSize: '0.875rem',
                          }}
                        >
                          {msg.avatar || (msg.senderRole === 'user' ? <PersonIcon /> : 'A')}
                        </Avatar>
                      </ListItemAvatar>
                      <Box>
                        <Paper
                          sx={{
                            p: 1.5,
                            bgcolor:
                              msg.senderRole === 'user' ? palette.primaryDark : palette.primary,
                            color: 'white',
                            borderRadius: 2,
                            borderTopLeftRadius: msg.senderRole === 'admin' ? 0 : 2,
                            borderTopRightRadius: msg.senderRole === 'user' ? 0 : 2,
                          }}
                        >
                          <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                            {msg.message}
                          </Typography>
                        </Paper>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            textAlign: msg.senderRole === 'user' ? 'right' : 'left',
                          }}
                        >
                          {msg.timestamp}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                ))}
                <div ref={chatEndRef} />
              </List>
            </Box>

            <Divider />

            {/* Chat Input */}
            <Box sx={{ p: 2, bgcolor: 'white' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type your message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  multiline
                  maxRows={3}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: palette.primary,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: palette.primary,
                      },
                    },
                  }}
                />
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                  sx={{
                    background: gradients.primary,
                    color: 'white',
                    '&:hover': {
                      background: gradients.primary,
                      opacity: 0.9,
                    },
                    '&.Mui-disabled': {
                      bgcolor: palette.gray300,
                      color: palette.gray500,
                    },
                  }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Press Enter to send, Shift+Enter for new line
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Document Preview Dialog */}
      <Dialog
        open={!!previewDocument}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        {previewDocument && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DescriptionIcon sx={{ color: palette.primary }} />
                <Box>
                  <Typography variant="h6">{previewDocument.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {previewDocument.size} • Uploaded{' '}
                    {new Date(previewDocument.uploadedAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Chip
                  label={previewDocument.isApproved ? 'Approved' : 'Pending Review'}
                  size="small"
                  sx={{
                    ml: 'auto',
                    bgcolor: previewDocument.isApproved ? palette.success : palette.warning,
                    color: 'white',
                  }}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box
                sx={{
                  height: 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: palette.offWhite,
                  borderRadius: 1,
                  border: `1px dashed ${palette.gray300}`,
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <DescriptionIcon sx={{ fontSize: 80, color: palette.primary, mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    Document preview would appear here
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    (Preview functionality requires backend integration)
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClosePreview}>Close</Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => {
                  handleDownloadDocument(previewDocument)
                  handleClosePreview()
                }}
                disabled={!previewDocument.isApproved}
                sx={{
                  background: gradients.primary,
                  '&:hover': {
                    background: gradients.primary,
                    opacity: 0.9,
                  },
                }}
              >
                Download
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  )
}

