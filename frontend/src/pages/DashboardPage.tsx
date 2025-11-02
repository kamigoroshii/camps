import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Paper,
  Chip,
  LinearProgress,
  IconButton,
  Divider,
  Alert,
  Fab,
  Tooltip,
  Badge,
  Zoom,
} from '@mui/material'
import {
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  Upload as UploadIcon,
  Description as DescriptionIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  SmartToy as SmartToyIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { useAuthStore } from '../stores/authStore'
import { palette, shadows } from '../theme'

interface StatCard {
  title: string
  value: number | string
  icon: React.ReactNode
  color: string
  description?: string
}

interface QuickAction {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
  primary?: boolean
}

interface RecentRequest {
  id: number
  title: string
  status: 'pending' | 'in_progress' | 'approved' | 'rejected'
  date: string
  daysRemaining?: number
}

interface SLAAlert {
  id: number
  title: string
  message: string
  severity: 'warning' | 'error'
  daysRemaining: number
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [hasUnreadMessages, setHasUnreadMessages] = useState(true)

  // Mock data - Replace with actual API calls
  const stats: StatCard[] = [
    {
      title: 'Active Requests',
      value: 5,
      icon: <AssignmentIcon />,
      color: palette.primary,
      description: '2 pending approval',
    },
    {
      title: 'Pending Approvals',
      value: 3,
      icon: <ScheduleIcon />,
      color: palette.warning,
      description: 'Action needed',
    },
    {
      title: 'Notifications',
      value: 7,
      icon: <NotificationsIcon />,
      color: palette.error,
      description: '3 unread',
    },
    {
      title: 'Completed',
      value: 12,
      icon: <CheckCircleIcon />,
      color: palette.success,
      description: 'This semester',
    },
  ]

  const quickActions: QuickAction[] = [
    {
      title: 'New Request',
      description: 'Submit a new academic request',
      icon: <AddIcon sx={{ fontSize: 28 }} />,
      onClick: () => navigate('/requests/new'),
      primary: true,
    },
    {
      title: 'Upload Documents',
      description: 'Add or manage your documents',
      icon: <UploadIcon sx={{ fontSize: 28 }} />,
      onClick: () => navigate('/profile?tab=documents'),
      primary: true,
    },
    {
      title: 'View All Requests',
      description: 'Track and monitor all requests',
      icon: <TimelineIcon sx={{ fontSize: 28 }} />,
      onClick: () => navigate('/requests'),
    },
    {
      title: 'My Documents',
      description: 'Access uploaded documents',
      icon: <DescriptionIcon sx={{ fontSize: 28 }} />,
      onClick: () => navigate('/profile?tab=documents'),
    },
  ]

  const slaAlerts: SLAAlert[] = [
    {
      id: 1,
      title: 'Course Registration Deadline',
      message: 'Your course registration request needs action before the deadline',
      severity: 'error',
      daysRemaining: 2,
    },
    {
      id: 2,
      title: 'Document Upload Required',
      message: 'Please upload missing documents for your scholarship application',
      severity: 'warning',
      daysRemaining: 5,
    },
  ]

  const recentRequests: RecentRequest[] = [
    { 
      id: 1, 
      title: 'Course Registration Request', 
      status: 'in_progress', 
      date: '2 days ago',
      daysRemaining: 3,
    },
    { 
      id: 2, 
      title: 'Grade Appeal Form', 
      status: 'pending', 
      date: '5 days ago',
      daysRemaining: 7,
    },
    { 
      id: 3, 
      title: 'Transcript Request', 
      status: 'approved', 
      date: '1 week ago',
    },
    { 
      id: 4, 
      title: 'Scholarship Application', 
      status: 'in_progress', 
      date: '1 week ago',
      daysRemaining: 10,
    },
  ]

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }, [])

  const getStatusColor = (status: string): 'default' | 'warning' | 'success' | 'error' | 'info' => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'in_progress':
        return 'info'
      case 'approved':
        return 'success'
      case 'rejected':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string): string => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }

  const handleChatToggle = () => {
    setChatOpen(!chatOpen)
    if (!chatOpen && hasUnreadMessages) {
      setHasUnreadMessages(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress 
          sx={{ 
            bgcolor: `rgba(${parseInt(palette.primary.slice(1, 3), 16)}, ${parseInt(palette.primary.slice(3, 5), 16)}, ${parseInt(palette.primary.slice(5, 7), 16)}, 0.1)`,
            '& .MuiLinearProgress-bar': {
              bgcolor: palette.primary,
            },
          }} 
        />
      </Box>
    )
  }

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header Section with Personalized Welcome */}
      <Box 
        sx={{ 
          mb: 4, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          flexWrap: 'wrap', 
          gap: 2,
        }}
      >
        <Box>
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              fontWeight: 700, 
              color: palette.textPrimary,
              mb: 0.5,
            }}
          >
            {getGreeting()}, {user?.full_name?.split(' ')[0] || 'User'}! 👋
          </Typography>
          <Typography variant="body1" sx={{ color: palette.textSecondary }}>
            Here's what's happening with your requests today
          </Typography>
        </Box>
        <Tooltip title="Refresh dashboard">
          <IconButton
            onClick={handleRefresh}
            sx={{
              bgcolor: palette.white,
              boxShadow: shadows.sm,
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* SLA & Pending Task Alerts */}
      {slaAlerts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          {slaAlerts.map((alert) => (
            <Alert
              key={alert.id}
              severity={alert.severity}
              icon={<WarningIcon />}
              sx={{
                mb: 2,
                bgcolor: alert.severity === 'error' 
                  ? 'rgba(211, 47, 47, 0.08)' 
                  : 'rgba(237, 108, 2, 0.08)',
                border: `1px solid ${alert.severity === 'error' ? palette.error : palette.warning}`,
                '& .MuiAlert-icon': {
                  color: alert.severity === 'error' ? palette.error : palette.warning,
                },
              }}
              action={
                <Button
                  size="small"
                  sx={{
                    color: alert.severity === 'error' ? palette.error : palette.warning,
                    fontWeight: 600,
                  }}
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/requests')}
                >
                  Take Action
                </Button>
              }
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {alert.title} - {alert.daysRemaining} {alert.daysRemaining === 1 ? 'day' : 'days'} remaining
              </Typography>
              <Typography variant="body2">
                {alert.message}
              </Typography>
            </Alert>
          ))}
        </Box>
      )}

      {/* Summary Cards with Transparent Olive Backgrounds */}
      <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={6} sm={6} md={3} key={index}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                bgcolor: `rgba(${parseInt(palette.primary.slice(1, 3), 16)}, ${parseInt(palette.primary.slice(3, 5), 16)}, ${parseInt(palette.primary.slice(5, 7), 16)}, ${index % 2 === 0 ? '0.15' : '0.20'})`,
                border: `1px solid ${palette.borderLight}`,
                boxShadow: 'none !important',
                pointerEvents: 'none',
                '&:hover': {
                  border: `1px solid ${palette.borderLight}`,
                  boxShadow: 'none !important',
                },
              }}
            >
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      bgcolor: palette.white,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: stat.color,
                      fontSize: 20,
                      flexShrink: 0,
                      '& .MuiSvgIcon-root': {
                        fontSize: '20px',
                        display: 'block',
                      },
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700, 
                    color: palette.textPrimary, 
                    mb: 0.25,
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    lineHeight: 1.2,
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: palette.textPrimary, mb: 0.25, fontSize: '0.8rem', lineHeight: 1.3 }}>
                  {stat.title}
                </Typography>
                {stat.description && (
                  <Typography variant="caption" sx={{ color: palette.textSecondary, fontSize: '0.7rem', lineHeight: 1.2 }}>
                    {stat.description}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Action Buttons with Solid Olive Backgrounds */}
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 4,
          border: `1px solid ${palette.borderLight}`,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3, color: palette.textPrimary }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Button
                fullWidth
                variant={action.primary ? 'contained' : 'outlined'}
                onClick={action.onClick}
                sx={{
                  py: 2.5,
                  px: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5,
                  height: '100%',
                  textTransform: 'none',
                  ...(action.primary
                    ? {
                        bgcolor: palette.primary,
                        color: palette.white,
                        boxShadow: shadows.sm,
                      }
                    : {
                        borderColor: palette.primary,
                        color: palette.primary,
                        bgcolor: 'transparent',
                      }),
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: action.primary 
                      ? 'rgba(255, 255, 255, 0.2)' 
                      : `rgba(${parseInt(palette.primary.slice(1, 3), 16)}, ${parseInt(palette.primary.slice(3, 5), 16)}, ${parseInt(palette.primary.slice(5, 7), 16)}, 0.15)`,
                  }}
                >
                  {action.icon}
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {action.title}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
                    {action.description}
                  </Typography>
                </Box>
              </Button>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Recent Requests */}
        <Grid item xs={12} lg={8}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              border: `1px solid ${palette.borderLight}`,
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: palette.textPrimary }}>
                Recent Requests
              </Typography>
              <Button
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/requests')}
                sx={{
                  color: palette.primary,
                  fontWeight: 600,
                }}
              >
                View All
              </Button>
            </Box>
            <Box>
              {recentRequests.map((request, index) => (
                <Box key={request.id}>
                  <Box
                    sx={{
                      py: 2.5,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      borderRadius: 1,
                    }}
                    onClick={() => navigate(`/requests/${request.id}`)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                      <Avatar
                        sx={{
                          bgcolor: `rgba(${parseInt(palette.primary.slice(1, 3), 16)}, ${parseInt(palette.primary.slice(3, 5), 16)}, ${parseInt(palette.primary.slice(5, 7), 16)}, 0.15)`,
                          color: palette.primary,
                          width: 48,
                          height: 48,
                        }}
                      >
                        <AssignmentIcon />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ fontWeight: 600, mb: 0.5, color: palette.textPrimary }} 
                          noWrap
                        >
                          {request.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                            {request.date}
                          </Typography>
                          {request.daysRemaining && (
                            <>
                              <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                                •
                              </Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: request.daysRemaining <= 3 ? palette.error : palette.warning,
                                  fontWeight: 600,
                                }}
                              >
                                {request.daysRemaining} days left
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Box>
                    </Box>
                    <Chip
                      label={getStatusLabel(request.status)}
                      color={getStatusColor(request.status)}
                      size="small"
                      sx={{ fontWeight: 600, minWidth: 100 }}
                    />
                  </Box>
                  {index < recentRequests.length - 1 && <Divider />}
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Progress & Activity Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Progress Chart */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              mb: 3,
              border: `1px solid ${palette.borderLight}`,
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <TrendingUpIcon sx={{ color: palette.primary }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: palette.textPrimary }}>
                This Month's Progress
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                  Requests Submitted
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: palette.textPrimary }}>
                  8/10
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={80}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: `rgba(${parseInt(palette.primary.slice(1, 3), 16)}, ${parseInt(palette.primary.slice(3, 5), 16)}, ${parseInt(palette.primary.slice(5, 7), 16)}, 0.15)`,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: palette.primary,
                    borderRadius: 4,
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                  Approvals Received
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: palette.textPrimary }}>
                  12/15
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={80}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: `rgba(${parseInt(palette.success.slice(1, 3), 16)}, ${parseInt(palette.success.slice(3, 5), 16)}, ${parseInt(palette.success.slice(5, 7), 16)}, 0.15)`,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: palette.success,
                    borderRadius: 4,
                  },
                }}
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                  Response Rate
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: palette.textPrimary }}>
                  95%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={95}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: `rgba(${parseInt(palette.info.slice(1, 3), 16)}, ${parseInt(palette.info.slice(3, 5), 16)}, ${parseInt(palette.info.slice(5, 7), 16)}, 0.15)`,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: palette.info,
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          </Paper>

          {/* Activity Feed */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              border: `1px solid ${palette.borderLight}`,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3, color: palette.textPrimary }}>
              Recent Activity
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {[
                { 
                  icon: <CheckCircleIcon sx={{ fontSize: 20 }} />, 
                  color: palette.success,
                  text: 'Request #1234 approved', 
                  time: '2h ago',
                },
                { 
                  icon: <ScheduleIcon sx={{ fontSize: 20 }} />, 
                  color: palette.warning,
                  text: 'Action required on Request #1235', 
                  time: '4h ago',
                },
                { 
                  icon: <NotificationsIcon sx={{ fontSize: 20 }} />, 
                  color: palette.info,
                  text: 'New message from advisor', 
                  time: '1d ago',
                },
                { 
                  icon: <AssignmentIcon sx={{ fontSize: 20 }} />, 
                  color: palette.primary,
                  text: 'Request #1236 submitted', 
                  time: '2d ago',
                },
              ].map((activity, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: `${activity.color}15`,
                      color: activity.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {activity.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ mb: 0.5, color: palette.textPrimary }}>
                      {activity.text}
                    </Typography>
                    <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                      {activity.time}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Floating RAG AI Chatbot Icon */}
      <Zoom in={true}>
        <Box
          sx={{
            position: 'fixed',
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            zIndex: 1000,
          }}
        >
          {chatOpen ? (
            <Paper
              elevation={8}
              sx={{
                width: { xs: 'calc(100vw - 32px)', sm: 380 },
                height: 500,
                borderRadius: 3,
                overflow: 'hidden',
                border: `2px solid ${palette.primary}`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Chat Header */}
              <Box
                sx={{
                  bgcolor: palette.primary,
                  color: palette.white,
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      bgcolor: palette.white,
                      color: palette.primary,
                      width: 36,
                      height: 36,
                    }}
                  >
                    <SmartToyIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      AI Assistant
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      RAG-powered help
                    </Typography>
                  </Box>
                </Box>
                <IconButton
                  size="small"
                  onClick={handleChatToggle}
                  sx={{
                    color: palette.white,
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>

              {/* Chat Content */}
              <Box
                sx={{
                  flex: 1,
                  bgcolor: palette.backgroundAlt,
                  p: 2,
                  overflowY: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box sx={{ textAlign: 'center', maxWidth: 280 }}>
                  <SmartToyIcon sx={{ fontSize: 64, color: palette.primary, mb: 2, opacity: 0.6 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: palette.textPrimary }}>
                    AI Assistant
                  </Typography>
                  <Typography variant="body2" sx={{ color: palette.textSecondary, mb: 2 }}>
                    Ask me anything about your requests, documents, or campus policies
                  </Typography>
                  <Typography variant="caption" sx={{ color: palette.textSecondary, display: 'block', fontStyle: 'italic' }}>
                    💡 RAG integration coming soon
                  </Typography>
                </Box>
              </Box>

              {/* Chat Input */}
              <Box
                sx={{
                  p: 2,
                  borderTop: `1px solid ${palette.borderLight}`,
                  bgcolor: palette.white,
                }}
              >
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{
                    py: 1.5,
                    color: palette.textSecondary,
                    borderColor: palette.borderLight,
                    textTransform: 'none',
                    justifyContent: 'flex-start',
                  }}
                >
                  Type your message...
                </Button>
              </Box>
            </Paper>
          ) : (
            <Tooltip title="Open AI Assistant" placement="left">
              <Fab
                onClick={handleChatToggle}
                sx={{
                  bgcolor: palette.primary,
                  color: palette.white,
                  width: 64,
                  height: 64,
                  boxShadow: shadows.lg,
                }}
              >
                <Badge
                  color="error"
                  variant="dot"
                  invisible={!hasUnreadMessages}
                  sx={{
                    '& .MuiBadge-dot': {
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      border: `2px solid ${palette.white}`,
                    },
                  }}
                >
                  <ChatIcon sx={{ fontSize: 32 }} />
                </Badge>
              </Fab>
            </Tooltip>
          )}
        </Box>
      </Zoom>
    </Box>
  )
}
