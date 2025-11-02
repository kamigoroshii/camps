import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tabs,
  Tab,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Badge,
  Tooltip,
} from '@mui/material'
import {
  OpenInNew as ExternalLinkIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Chat as ChatIcon,
  BugReport as BugIcon,
  Visibility as ViewIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  Computer as ComputerIcon,
  Support as SupportIcon,
  Assignment as TicketIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useAuthStore } from '../stores/authStore'

// Types
interface Issue {
  id: string
  title: string
  description: string
  category: string
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  submittedDate: string
  lastUpdated: string
  assignedTo?: string
}

interface SystemNotification {
  id: string
  type: 'system' | 'issue' | 'maintenance' | 'announcement'
  title: string
  message: string
  date: string
  read: boolean
  priority: 'low' | 'normal' | 'high'
}

const ISSUE_CATEGORIES = [
  'Login/Access Issues',
  'Grade/Marks Issues',
  'Attendance Issues',
  'Profile/Personal Info',
  'Payment/Fee Issues',
  'Technical Bug',
  'Feature Request',
  'Other',
]

export default function CamsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState(0)
  const [viewIssueDialog, setViewIssueDialog] = useState<Issue | null>(null)
  const [contactMethod, setContactMethod] = useState<'email' | 'ticket' | 'chat'>('email')
  
  // Form state
  const [issueForm, setIssueForm] = useState({
    title: '',
    category: '',
    description: '',
    priority: 'medium' as Issue['priority'],
  })

  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    urgency: 'normal' as 'low' | 'normal' | 'high',
  })

  // Mock data
  const [issues, setIssues] = useState<Issue[]>([
    {
      id: 'CAMS-2024-001',
      title: 'Unable to access grades for Semester 5',
      description: 'Getting error 404 when trying to view my grades',
      category: 'Grade/Marks Issues',
      status: 'in-progress',
      priority: 'high',
      submittedDate: '2024-10-28',
      lastUpdated: '2024-10-30',
      assignedTo: 'Admin Team',
    },
    {
      id: 'CAMS-2024-002',
      title: 'Attendance not reflecting correctly',
      description: 'My attendance shows 75% but should be 85%',
      category: 'Attendance Issues',
      status: 'resolved',
      priority: 'medium',
      submittedDate: '2024-10-25',
      lastUpdated: '2024-10-29',
      assignedTo: 'Faculty Coordinator',
    },
    {
      id: 'CAMS-2024-003',
      title: 'Login timeout issue',
      description: 'Getting logged out every 5 minutes',
      category: 'Technical Bug',
      status: 'open',
      priority: 'low',
      submittedDate: '2024-10-20',
      lastUpdated: '2024-10-20',
    },
  ])

  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: 'notif-1',
      type: 'maintenance',
      title: 'Scheduled Maintenance',
      message: 'EduPrime portal will be under maintenance on Nov 5, 2024 from 2 AM - 6 AM',
      date: '2024-11-01',
      read: false,
      priority: 'high',
    },
    {
      id: 'notif-2',
      type: 'issue',
      title: 'Issue Update: CAMS-2024-002',
      message: 'Your attendance issue has been resolved. Please check your portal.',
      date: '2024-10-29',
      read: false,
      priority: 'normal',
    },
    {
      id: 'notif-3',
      type: 'announcement',
      title: 'New Feature: Mobile App',
      message: 'CAMS mobile app is now available on iOS and Android',
      date: '2024-10-28',
      read: true,
      priority: 'low',
    },
    {
      id: 'notif-4',
      type: 'system',
      title: 'Password Expiry Reminder',
      message: 'Your password will expire in 15 days. Please update it.',
      date: '2024-10-27',
      read: true,
      priority: 'normal',
    },
  ])

  const unreadNotifications = notifications.filter(n => !n.read).length

  const handleSubmitIssue = () => {
    const newIssue: Issue = {
      id: `CAMS-2024-${String(issues.length + 1).padStart(3, '0')}`,
      title: issueForm.title,
      description: issueForm.description,
      category: issueForm.category,
      status: 'open',
      priority: issueForm.priority,
      submittedDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
    }
    setIssues([newIssue, ...issues])
    setIssueForm({ title: '', category: '', description: '', priority: 'medium' })
  }

  const handleContactSubmit = () => {
    // Simulate contact submission
    setContactForm({ subject: '', message: '', urgency: 'normal' })
  }

  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const getStatusColor = (status: Issue['status']) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return '#2e7d32' // success green
      case 'in-progress':
        return '#0288d1' // info blue
      case 'open':
        return '#ed6c02' // warning orange
      default:
        return '#9E9E9E' // gray
    }
  }

  const getPriorityColor = (priority: Issue['priority']) => {
    switch (priority) {
      case 'critical':
        return '#d32f2f' // error red
      case 'high':
        return '#ed6c02' // warning orange
      case 'medium':
        return '#0288d1' // info blue
      case 'low':
        return '#2e7d32' // success green
      default:
        return '#9E9E9E' // gray
    }
  }

  const getStatusIcon = (status: Issue['status']) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return <CheckCircleIcon fontSize="small" />
      case 'in-progress':
        return <ScheduleIcon fontSize="small" />
      case 'open':
        return <PendingIcon fontSize="small" />
      default:
        return <ErrorIcon fontSize="small" />
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#95A37F', mb: 0.5 }}>
            <ComputerIcon sx={{ fontSize: 32, verticalAlign: 'middle', mr: 1 }} />
            CAMS Portal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Computer Aided Management System - Support & Issue Tracking
          </Typography>
        </Box>
        <Badge badgeContent={unreadNotifications} color="error">
          <NotificationsIcon sx={{ fontSize: 32, color: '#95A37F' }} />
        </Badge>
      </Box>

      {/* EduPrime Quick Link Card */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #95A37F 0%, #B4C09F 100%)',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                EduPrime Portal Access
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, opacity: 0.95 }}>
                Quick access to your academic portal for grades, attendance, course materials, and more
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  label="Grades"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                />
                <Chip
                  label="Attendance"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                />
                <Chip
                  label="Timetable"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                />
                <Chip
                  label="Course Materials"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                endIcon={<ExternalLinkIcon />}
                href="https://automation.vnrvjiet.ac.in/eduprime3"
                target="_blank"
                sx={{
                  bgcolor: '#FFFFFF',
                  color: '#95A37F',
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  '&:hover': {
                    bgcolor: '#F5F5F5',
                  },
                }}
              >
                Open EduPrime
              </Button>
            </Grid>
          </Grid>
        </Box>
        {/* Decorative circles */}
        <Box
          sx={{
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.1)',
            top: -50,
            right: -50,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 150,
            height: 150,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.08)',
            bottom: -30,
            left: -30,
          }}
        />
      </Paper>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                },
                '& .Mui-selected': {
                  color: '#95A37F',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#95A37F',
                  height: 3,
                },
              }}
            >
              <Tab label="Submit Issue" icon={<BugIcon />} iconPosition="start" />
              <Tab label="Issue Tracker" icon={<TicketIcon />} iconPosition="start" />
              <Tab label="Contact Support" icon={<SupportIcon />} iconPosition="start" />
            </Tabs>

            {/* Tab 1: Submit Issue */}
            {activeTab === 0 && (
              <Box sx={{ p: 3 }}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Experiencing issues with CAMS or EduPrime? Submit a detailed report and our team will assist you.
                </Alert>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Your Email"
                      value={user?.email || 'student@vnrvjiet.in'}
                      disabled
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: '#F5F5F5',
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Issue Title"
                      value={issueForm.title}
                      onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                      placeholder="Brief description of the issue"
                      sx={{
                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#95A37F',
                          borderWidth: 2,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={issueForm.category}
                        onChange={(e) => setIssueForm({ ...issueForm, category: e.target.value })}
                        label="Category"
                        sx={{
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#95A37F',
                            borderWidth: 2,
                          },
                        }}
                      >
                        {ISSUE_CATEGORIES.map((cat) => (
                          <MenuItem key={cat} value={cat}>
                            {cat}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={issueForm.priority}
                        onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value as Issue['priority'] })}
                        label="Priority"
                        sx={{
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#95A37F',
                            borderWidth: 2,
                          },
                        }}
                      >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="critical">Critical</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      label="Detailed Description"
                      value={issueForm.description}
                      onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                      placeholder="Please provide as much detail as possible about the issue..."
                      sx={{
                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#95A37F',
                          borderWidth: 2,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<SendIcon />}
                      onClick={handleSubmitIssue}
                      disabled={!issueForm.title || !issueForm.category || !issueForm.description}
                      sx={{
                        bgcolor: '#95A37F',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        px: 4,
                        '&:hover': {
                          bgcolor: '#6D7A5C',
                        },
                      }}
                    >
                      Submit Issue
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Tab 2: Issue Tracker */}
            {activeTab === 1 && (
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Your Submitted Issues ({issues.length})
                  </Typography>
                  <Button
                    startIcon={<RefreshIcon />}
                    sx={{
                      color: '#95A37F',
                      fontWeight: 600,
                    }}
                  >
                    Refresh
                  </Button>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#95A37F' }}>
                        <TableCell sx={{ color: '#FFFFFF', fontWeight: 700 }}>Issue ID</TableCell>
                        <TableCell sx={{ color: '#FFFFFF', fontWeight: 700 }}>Title</TableCell>
                        <TableCell sx={{ color: '#FFFFFF', fontWeight: 700 }}>Category</TableCell>
                        <TableCell sx={{ color: '#FFFFFF', fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ color: '#FFFFFF', fontWeight: 700 }}>Priority</TableCell>
                        <TableCell sx={{ color: '#FFFFFF', fontWeight: 700 }}>Updated</TableCell>
                        <TableCell sx={{ color: '#FFFFFF', fontWeight: 700 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {issues.map((issue) => (
                        <TableRow key={issue.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#95A37F' }}>
                              {issue.id}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {issue.title}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={issue.category} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(issue.status)}
                              label={issue.status.toUpperCase().replace('-', ' ')}
                              size="small"
                              sx={{
                                bgcolor: getStatusColor(issue.status) + '20',
                                color: getStatusColor(issue.status),
                                fontWeight: 600,
                                border: `1px solid ${getStatusColor(issue.status)}`,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={issue.priority.toUpperCase()}
                              size="small"
                              sx={{
                                bgcolor: getPriorityColor(issue.priority) + '20',
                                color: getPriorityColor(issue.priority),
                                fontWeight: 600,
                                border: `1px solid ${getPriorityColor(issue.priority)}`,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(issue.lastUpdated).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => setViewIssueDialog(issue)}
                                sx={{ color: '#95A37F' }}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {issues.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No issues submitted yet
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Tab 3: Contact Support */}
            {activeTab === 2 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Choose Contact Method
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: contactMethod === 'email' ? '2px solid #95A37F' : '1px solid #E0E0E0',
                        bgcolor: contactMethod === 'email' ? '#95A37F10' : 'transparent',
                      }}
                      onClick={() => setContactMethod('email')}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <EmailIcon sx={{ fontSize: 48, color: '#95A37F', mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Email
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Send us an email
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: contactMethod === 'ticket' ? '2px solid #95A37F' : '1px solid #E0E0E0',
                        bgcolor: contactMethod === 'ticket' ? '#95A37F10' : 'transparent',
                      }}
                      onClick={() => setContactMethod('ticket')}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <TicketIcon sx={{ fontSize: 48, color: '#95A37F', mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Ticket
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Create a support ticket
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: contactMethod === 'chat' ? '2px solid #95A37F' : '1px solid #E0E0E0',
                        bgcolor: contactMethod === 'chat' ? '#95A37F10' : 'transparent',
                      }}
                      onClick={() => setContactMethod('chat')}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <ChatIcon sx={{ fontSize: 48, color: '#95A37F', mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Live Chat
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Chat with support
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Contact Form
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Subject"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#95A37F',
                            borderWidth: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Urgency</InputLabel>
                        <Select
                          value={contactForm.urgency}
                          onChange={(e) => setContactForm({ ...contactForm, urgency: e.target.value as any })}
                          label="Urgency"
                          sx={{
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#95A37F',
                              borderWidth: 2,
                            },
                          }}
                        >
                          <MenuItem value="low">Low</MenuItem>
                          <MenuItem value="normal">Normal</MenuItem>
                          <MenuItem value="high">High</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={6}
                        label="Message"
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="Describe your query or concern..."
                        sx={{
                          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#95A37F',
                            borderWidth: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<SendIcon />}
                        onClick={handleContactSubmit}
                        disabled={!contactForm.subject || !contactForm.message}
                        sx={{
                          bgcolor: '#95A37F',
                          color: '#FFFFFF',
                          fontWeight: 600,
                          px: 4,
                          '&:hover': {
                            bgcolor: '#6D7A5C',
                          },
                        }}
                      >
                        Send Message
                      </Button>
                    </Grid>
                  </Grid>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Other Contact Options
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <PhoneIcon sx={{ fontSize: 32, color: '#95A37F' }} />
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Phone Support
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                +91 40-2304-2758
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <EmailIcon sx={{ fontSize: 32, color: '#95A37F' }} />
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Email Support
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                support@vnrvjiet.in
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Sidebar - Live Notifications */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              border: '2px solid #95A37F',
              position: 'sticky',
              top: 20,
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#95A37F' }}>
                Live Notifications
              </Typography>
              <Badge badgeContent={unreadNotifications} color="error">
                <NotificationsIcon sx={{ color: '#95A37F' }} />
              </Badge>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <List>
              {notifications.map((notif, index) => (
                <Box key={notif.id}>
                  <ListItem
                    sx={{
                      bgcolor: notif.read ? 'transparent' : '#95A37F10',
                      borderRadius: 1,
                      mb: 1,
                      border: notif.read ? '1px solid #E0E0E0' : '2px solid #95A37F',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      p: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ListItemIcon sx={{ minWidth: 'auto' }}>
                          {notif.type === 'system' && <ComputerIcon sx={{ color: '#0288d1' }} />}
                          {notif.type === 'issue' && <BugIcon sx={{ color: '#ed6c02' }} />}
                          {notif.type === 'maintenance' && <ErrorIcon sx={{ color: '#d32f2f' }} />}
                          {notif.type === 'announcement' && <NotificationsIcon sx={{ color: '#2e7d32' }} />}
                        </ListItemIcon>
                        <Chip
                          label={notif.type.toUpperCase()}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                      {!notif.read && (
                        <IconButton
                          size="small"
                          onClick={() => handleMarkNotificationRead(notif.id)}
                          sx={{ p: 0.5 }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <ListItemText
                      primary={notif.title}
                      secondary={notif.message}
                      primaryTypographyProps={{
                        fontWeight: notif.read ? 500 : 700,
                        fontSize: '0.9rem',
                        mb: 0.5,
                      }}
                      secondaryTypographyProps={{
                        fontSize: '0.85rem',
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                      {new Date(notif.date).toLocaleDateString()}
                    </Typography>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </Box>
              ))}
            </List>

            {notifications.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <NotificationsIcon sx={{ fontSize: 48, color: '#BDBDBD', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No notifications
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* View Issue Dialog */}
      <Dialog open={!!viewIssueDialog} onClose={() => setViewIssueDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Issue Details
            </Typography>
            <Chip
              icon={getStatusIcon(viewIssueDialog?.status || 'open')}
              label={viewIssueDialog?.status.toUpperCase().replace('-', ' ')}
              sx={{
                bgcolor: getStatusColor(viewIssueDialog?.status || 'open') + '20',
                color: getStatusColor(viewIssueDialog?.status || 'open'),
                fontWeight: 700,
                border: `1px solid ${getStatusColor(viewIssueDialog?.status || 'open')}`,
              }}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {viewIssueDialog && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Issue ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#95A37F' }}>
                    {viewIssueDialog.id}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Title
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {viewIssueDialog.title}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Category
                  </Typography>
                  <Chip label={viewIssueDialog.category} sx={{ mt: 0.5 }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Priority
                  </Typography>
                  <Chip
                    label={viewIssueDialog.priority.toUpperCase()}
                    sx={{
                      mt: 0.5,
                      bgcolor: getPriorityColor(viewIssueDialog.priority) + '20',
                      color: getPriorityColor(viewIssueDialog.priority),
                      fontWeight: 600,
                      border: `1px solid ${getPriorityColor(viewIssueDialog.priority)}`,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {viewIssueDialog.description}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Submitted Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {new Date(viewIssueDialog.submittedDate).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {new Date(viewIssueDialog.lastUpdated).toLocaleDateString()}
                  </Typography>
                </Grid>
                {viewIssueDialog.assignedTo && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Assigned To
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {viewIssueDialog.assignedTo}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewIssueDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
