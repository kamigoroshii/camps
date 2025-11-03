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
import { toast } from 'react-toastify'
import { useAuthStore } from '../stores/authStore'
import { palette, shadows } from '../theme'
import dashboardApi, { 
  RecentRequest as ApiRecentRequest, 
  ActivityItem,
  NotificationData 
} from '../services/dashboardApi'

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
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'submitted' | 'under_review' | 'pending_approval' | 'completed'
  date: string
  daysRemaining?: number
  request_number?: string
}

interface SLAAlert {
  id: number
  title: string
  message: string
  severity: 'warning' | 'error'
  daysRemaining: number
  requestId?: number
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
  const [stats, setStats] = useState({
    activeRequests: 0,
    pendingApprovals: 0,
    notifications: 0,
    completed: 0
  })
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([])
  const [slaAlerts, setSlaAlerts] = useState<SLAAlert[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [notifications, setNotifications] = useState<NotificationData[]>([])

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load user stats
      const userStats = await dashboardApi.getUserDashboardStats()
      setStats(userStats)
      
      // Load recent requests
      const requests = await dashboardApi.getRecentRequests(4)
      const formattedRequests: RecentRequest[] = requests.map(req => {
        const dueDate = req.sla_due_date ? new Date(req.sla_due_date) : null
        const now = new Date()
        const daysRemaining = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : undefined
        
        return {
          id: req.id,
          title: req.title,
          status: req.status.toLowerCase().replace('_', '_') as any,
          date: formatDate(req.created_at),
          daysRemaining: daysRemaining && daysRemaining > 0 ? daysRemaining : undefined,
          request_number: req.request_number
        }
      })
      setRecentRequests(formattedRequests)
      
      // Load SLA alerts
      const alerts = await dashboardApi.getSLAAlerts()
      setSlaAlerts(alerts)
      
      // Load recent activity
      const activity = await dashboardApi.getRecentActivity(4)
      setRecentActivity(activity)
      
      // Load notifications
      const notifs = await dashboardApi.getNotifications(false, 5)
      setNotifications(notifs)
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 14) return '1 week ago'
    return `${Math.floor(diffDays / 7)} weeks ago`
  }

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

  useEffect(() => {
    loadDashboardData()
  }, [])

  const getStatusColor = (status: string): 'default' | 'warning' | 'success' | 'error' | 'info' => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'submitted':
        return 'warning'
      case 'in_progress':
      case 'under_review':
      case 'pending_approval':
        return 'info'
      case 'approved':
      case 'completed':
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
    loadDashboardData()
  }

  const getActivityColor = (action: string): string => {
    switch (action) {
      case 'REQUEST_APPROVED':
        return palette.success
      case 'REQUEST_SUBMITTED':
      case 'REQUEST_CREATED':
        return palette.primary
      case 'NOTIFICATION_SENT':
        return palette.info
      case 'REQUEST_REJECTED':
        return palette.error
      default:
        return palette.primary
    }
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'REQUEST_APPROVED':
        return <CheckCircleIcon sx={{ fontSize: 20 }} />
      case 'REQUEST_SUBMITTED':
      case 'REQUEST_CREATED':
        return <AssignmentIcon sx={{ fontSize: 20 }} />
      case 'NOTIFICATION_SENT':
        return <NotificationsIcon sx={{ fontSize: 20 }} />
      case 'REQUEST_REJECTED':
        return <ScheduleIcon sx={{ fontSize: 20 }} />
      default:
        return <AssignmentIcon sx={{ fontSize: 20 }} />
    }
  }

  const handleChatToggle = () => {
    // Navigate to the chat page instead of opening inline chat
    navigate('/chat')
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
        <Grid item xs={6} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              bgcolor: `rgba(${parseInt(palette.primary.slice(1, 3), 16)}, ${parseInt(palette.primary.slice(3, 5), 16)}, ${parseInt(palette.primary.slice(5, 7), 16)}, 0.15)`,
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
                    color: palette.primary,
                    fontSize: 20,
                    flexShrink: 0,
                    '& .MuiSvgIcon-root': {
                      fontSize: '20px',
                      display: 'block',
                    },
                  }}
                >
                  <AssignmentIcon />
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
                {stats.activeRequests}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: palette.textPrimary, mb: 0.25, fontSize: '0.8rem', lineHeight: 1.3 }}>
                Active Requests
              </Typography>
              <Typography variant="caption" sx={{ color: palette.textSecondary, fontSize: '0.7rem', lineHeight: 1.2 }}>
                In progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              bgcolor: `rgba(${parseInt(palette.warning.slice(1, 3), 16)}, ${parseInt(palette.warning.slice(3, 5), 16)}, ${parseInt(palette.warning.slice(5, 7), 16)}, 0.20)`,
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
                    color: palette.warning,
                    fontSize: 20,
                    flexShrink: 0,
                    '& .MuiSvgIcon-root': {
                      fontSize: '20px',
                      display: 'block',
                    },
                  }}
                >
                  <ScheduleIcon />
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
                {stats.pendingApprovals}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: palette.textPrimary, mb: 0.25, fontSize: '0.8rem', lineHeight: 1.3 }}>
                Pending Approvals
              </Typography>
              <Typography variant="caption" sx={{ color: palette.textSecondary, fontSize: '0.7rem', lineHeight: 1.2 }}>
                Action needed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              bgcolor: `rgba(${parseInt(palette.error.slice(1, 3), 16)}, ${parseInt(palette.error.slice(3, 5), 16)}, ${parseInt(palette.error.slice(5, 7), 16)}, 0.15)`,
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
                    color: palette.error,
                    fontSize: 20,
                    flexShrink: 0,
                    '& .MuiSvgIcon-root': {
                      fontSize: '20px',
                      display: 'block',
                    },
                  }}
                >
                  <NotificationsIcon />
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
                {stats.notifications}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: palette.textPrimary, mb: 0.25, fontSize: '0.8rem', lineHeight: 1.3 }}>
                Notifications
              </Typography>
              <Typography variant="caption" sx={{ color: palette.textSecondary, fontSize: '0.7rem', lineHeight: 1.2 }}>
                Unread messages
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              bgcolor: `rgba(${parseInt(palette.success.slice(1, 3), 16)}, ${parseInt(palette.success.slice(3, 5), 16)}, ${parseInt(palette.success.slice(5, 7), 16)}, 0.20)`,
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
                    color: palette.success,
                    fontSize: 20,
                    flexShrink: 0,
                    '& .MuiSvgIcon-root': {
                      fontSize: '20px',
                      display: 'block',
                    },
                  }}
                >
                  <CheckCircleIcon />
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
                {stats.completed}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: palette.textPrimary, mb: 0.25, fontSize: '0.8rem', lineHeight: 1.3 }}>
                Completed
              </Typography>
              <Typography variant="caption" sx={{ color: palette.textSecondary, fontSize: '0.7rem', lineHeight: 1.2 }}>
                This semester
              </Typography>
            </CardContent>
          </Card>
        </Grid>
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

      {/* Department Quick Access Cards */}
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
          Departments
        </Typography>
        <Grid container spacing={2}>
          {/* Student Service Center */}
          <Grid item xs={12} sm={6} md={4}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                cursor: 'pointer',
                border: `2px solid ${palette.primary}`,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: shadows.lg,
                  borderColor: palette.primaryDark,
                },
              }}
              onClick={() => navigate('/requests')}
            >
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: `rgba(${parseInt(palette.primary.slice(1, 3), 16)}, ${parseInt(palette.primary.slice(3, 5), 16)}, ${parseInt(palette.primary.slice(5, 7), 16)}, 0.15)`,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <AssignmentIcon sx={{ fontSize: 32, color: palette.primary }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: palette.textPrimary }}>
                  Student Service Center
                </Typography>
                <Typography variant="body2" sx={{ color: palette.textSecondary, mb: 2 }}>
                  Certificates, Bus Pass, Memo Cards, and more
                </Typography>
                <Button
                  variant="text"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ color: palette.primary, fontWeight: 600 }}
                >
                  Access Services
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Scholarship Department */}
          <Grid item xs={12} sm={6} md={4}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                cursor: 'pointer',
                border: `2px solid ${palette.secondary}`,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: shadows.lg,
                  borderColor: palette.secondaryDark,
                },
              }}
              onClick={() => navigate('/scholarships')}
            >
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: `rgba(${parseInt(palette.secondary.slice(1, 3), 16)}, ${parseInt(palette.secondary.slice(3, 5), 16)}, ${parseInt(palette.secondary.slice(5, 7), 16)}, 0.15)`,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <DescriptionIcon sx={{ fontSize: 32, color: palette.secondary }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: palette.textPrimary }}>
                  Scholarship Department
                </Typography>
                <Typography variant="body2" sx={{ color: palette.textSecondary, mb: 2 }}>
                  Apply for scholarships and financial aid
                </Typography>
                <Button
                  variant="text"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ color: palette.secondary, fontWeight: 600 }}
                >
                  View Scholarships
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* CAMS Department */}
          <Grid item xs={12} sm={6} md={4}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                cursor: 'pointer',
                border: `2px solid ${palette.info}`,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: shadows.lg,
                  borderColor: palette.infoDark,
                },
              }}
              onClick={() => navigate('/cams')}
            >
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: `rgba(${parseInt(palette.info.slice(1, 3), 16)}, ${parseInt(palette.info.slice(3, 5), 16)}, ${parseInt(palette.info.slice(5, 7), 16)}, 0.15)`,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <TimelineIcon sx={{ fontSize: 32, color: palette.info }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: palette.textPrimary }}>
                  CAMS Department
                </Typography>
                <Typography variant="body2" sx={{ color: palette.textSecondary, mb: 2 }}>
                  Campus Activities Management System
                </Typography>
                <Button
                  variant="text"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ color: palette.info, fontWeight: 600 }}
                >
                  Open CAMS
                </Button>
              </CardContent>
            </Card>
          </Grid>
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
                          {request.request_number && (
                            <>
                              <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                                •
                              </Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: palette.textSecondary,
                                  fontWeight: 500,
                                }}
                              >
                                #{request.request_number}
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
              {recentActivity.map((activity, index) => (
                <Box key={activity.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: `${getActivityColor(activity.action)}15`,
                      color: getActivityColor(activity.action),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getActivityIcon(activity.action)}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ mb: 0.5, color: palette.textPrimary }}>
                      {activity.description}
                    </Typography>
                    <Typography variant="caption" sx={{ color: palette.textSecondary }}>
                      {formatDate(activity.created_at)}
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
          <Tooltip title="Open AI Chat Assistant" placement="left">
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
        </Box>
      </Zoom>
    </Box>
  )
}
