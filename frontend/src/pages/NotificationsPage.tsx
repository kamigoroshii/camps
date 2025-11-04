import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
  Divider,
  IconButton,
  Tabs,
  Tab,
  Badge,
  Alert,
  CircularProgress,
} from '@mui/material'
import api from '../services/api'
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Payment as PaymentIcon,
  Event as EventIcon,
  Announcement as AnnouncementIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
  Circle as CircleIcon,
} from '@mui/icons-material'

// Types
interface Notification {
  id: string
  type: 'success' | 'info' | 'warning' | 'error' | 'announcement'
  category: 'academic' | 'request' | 'payment' | 'event' | 'system' | 'general'
  title: string
  message: string
  date: string
  read: boolean
  actionUrl?: string
}

const NOTIFICATION_DATA: Notification[] = [
  {
    id: 'notif-1',
    type: 'success',
    category: 'request',
    title: 'Request Approved',
    message: 'Your bonafide certificate request has been approved and is ready for collection.',
    date: '2024-11-03T10:30:00',
    read: false,
    actionUrl: '/requests/REQ-2024-001',
  },
  {
    id: 'notif-2',
    type: 'info',
    category: 'academic',
    title: 'Grade Published',
    message: 'Semester 5 grades have been published. Check your EduPrime portal.',
    date: '2024-11-02T14:20:00',
    read: false,
    actionUrl: '/cams',
  },
  {
    id: 'notif-3',
    type: 'warning',
    category: 'payment',
    title: 'Fee Payment Reminder',
    message: 'Your tuition fee payment is due on November 15, 2024. Please pay before the deadline.',
    date: '2024-11-01T09:00:00',
    read: false,
  },
  {
    id: 'notif-4',
    type: 'announcement',
    category: 'event',
    title: 'Tech Fest 2024',
    message: 'Annual Tech Fest registration is now open. Register before November 10th.',
    date: '2024-10-31T16:45:00',
    read: true,
  },
  {
    id: 'notif-5',
    type: 'success',
    category: 'request',
    title: 'Document Uploaded',
    message: 'Your scholarship documents have been successfully uploaded and are under review.',
    date: '2024-10-30T11:15:00',
    read: true,
    actionUrl: '/scholarships',
  },
  {
    id: 'notif-6',
    type: 'error',
    category: 'request',
    title: 'Document Rejection',
    message: 'Your marksheet document was rejected. Reason: Poor image quality. Please resubmit.',
    date: '2024-10-29T13:30:00',
    read: true,
    actionUrl: '/scholarships',
  },
  {
    id: 'notif-7',
    type: 'info',
    category: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on November 5, 2024 from 2 AM to 6 AM. Services may be unavailable.',
    date: '2024-10-28T10:00:00',
    read: true,
  },
  {
    id: 'notif-8',
    type: 'info',
    category: 'academic',
    title: 'Attendance Update',
    message: 'Your attendance for Data Structures course has been updated to 85%.',
    date: '2024-10-27T15:20:00',
    read: true,
  },
  {
    id: 'notif-9',
    type: 'announcement',
    category: 'general',
    title: 'Holiday Notification',
    message: 'College will remain closed on November 12, 2024 for Diwali celebrations.',
    date: '2024-10-26T09:30:00',
    read: true,
  },
  {
    id: 'notif-10',
    type: 'success',
    category: 'payment',
    title: 'Payment Confirmed',
    message: 'Your semester fee payment of ₹50,000 has been successfully processed.',
    date: '2024-10-25T12:45:00',
    read: true,
  },
  {
    id: 'notif-11',
    type: 'info',
    category: 'request',
    title: 'Request Status Update',
    message: 'Your bus pass application is currently under review by the transport department.',
    date: '2024-10-24T14:10:00',
    read: true,
  },
  {
    id: 'notif-12',
    type: 'warning',
    category: 'academic',
    title: 'Low Attendance Alert',
    message: 'Your attendance in Computer Networks is 72%. Minimum required is 75%.',
    date: '2024-10-23T10:30:00',
    read: true,
  },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  // Fetch notifications from API
  useEffect(() => {
    fetchNotifications()
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications')
      const apiNotifications = response.data.map((notif: any) => ({
        id: notif.id.toString(),
        type: getNotificationType(notif.title),
        category: 'request',
        title: notif.title,
        message: notif.message,
        date: notif.sent_at,
        read: notif.is_read,
        actionUrl: notif.request_id ? `/scholarship` : undefined,
      }))
      setNotifications(apiNotifications)
      setLoading(false)
      setError(null)
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err)
      if (err.response?.status === 401) {
        setError('Please log in to view notifications')
      } else {
        setError('Failed to load notifications')
      }
      setLoading(false)
      setNotifications([])
    }
  }

  const getNotificationType = (title: string): Notification['type'] => {
    if (title.includes('Approved') || title.includes('🎉')) return 'success'
    if (title.includes('Rejected') || title.includes('Required')) return 'warning'
    if (title.includes('Error')) return 'error'
    return 'info'
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      )
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter(n => !n.read)
          .map(n => api.put(`/notifications/${n.id}/read`))
      )
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 1:
        return notifications.filter(n => !n.read)
      case 2:
        return notifications.filter(n => n.read)
      default:
        return notifications
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon sx={{ color: '#2e7d32' }} />
      case 'info':
        return <InfoIcon sx={{ color: '#0288d1' }} />
      case 'warning':
        return <WarningIcon sx={{ color: '#ed6c02' }} />
      case 'error':
        return <ErrorIcon sx={{ color: '#d32f2f' }} />
      case 'announcement':
        return <AnnouncementIcon sx={{ color: '#95A37F' }} />
      default:
        return <InfoIcon sx={{ color: '#0288d1' }} />
    }
  }

  const getCategoryIcon = (category: Notification['category']) => {
    switch (category) {
      case 'academic':
        return <SchoolIcon fontSize="small" />
      case 'request':
        return <AssignmentIcon fontSize="small" />
      case 'payment':
        return <PaymentIcon fontSize="small" />
      case 'event':
        return <EventIcon fontSize="small" />
      default:
        return <NotificationsIcon fontSize="small" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const filteredNotifications = getFilteredNotifications()

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity={error.includes('log in') ? 'warning' : 'error'}
          action={
            error.includes('log in') ? (
              <Button color="inherit" size="small" href="/login">
                Login
              </Button>
            ) : undefined
          }
        >
          {error}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#95A37F', mb: 0.5 }}>
            <NotificationsIcon sx={{ fontSize: 32, verticalAlign: 'middle', mr: 1 }} />
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Stay updated with your requests, academics, and announcements
          </Typography>
        </Box>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon sx={{ fontSize: 32, color: '#95A37F' }} />
        </Badge>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ flex: 1, minWidth: 200, p: 3, border: '2px solid #95A37F', borderRadius: 2 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#95A37F', mb: 0.5, lineHeight: 1 }}>
            {unreadCount}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Unread Notifications
          </Typography>
        </Paper>
        <Paper sx={{ flex: 1, minWidth: 200, p: 3, border: '1px solid #E0E0E0', borderRadius: 2 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#616161', mb: 0.5, lineHeight: 1 }}>
            {notifications.length}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Total Notifications
          </Typography>
        </Paper>
      </Box>

      {/* Alert for unread notifications */}
      {unreadCount > 0 && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllAsRead}
              sx={{
                fontWeight: 600,
                '&:focus': {
                  outline: '2px solid #95A37F',
                  outlineOffset: 2,
                },
              }}
            >
              Mark All Read
            </Button>
          }
        >
          You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
        </Alert>
      )}

      {/* Main Content */}
      <Paper sx={{ border: '2px solid #95A37F' }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#F5F5F5' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                '&:focus': {
                  outline: '2px solid #95A37F',
                  outlineOffset: -2,
                },
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
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  All
                  <Chip
                    label={notifications.length}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      bgcolor: '#95A37F',
                      color: '#FFFFFF',
                    }}
                  />
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Unread
                  <Chip
                    label={unreadCount}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      bgcolor: '#d32f2f',
                      color: '#FFFFFF',
                    }}
                  />
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Read
                  <Chip
                    label={notifications.filter(n => n.read).length}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      bgcolor: '#9E9E9E',
                      color: '#FFFFFF',
                    }}
                  />
                </Box>
              }
            />
          </Tabs>
        </Box>

        {/* Bulk Actions Bar */}
        {unreadCount > 0 && activeTab !== 2 && (
          <Box
            sx={{
              p: 2,
              bgcolor: '#95A37F10',
              borderBottom: '1px solid #E0E0E0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#616161' }}>
              {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllAsRead}
              sx={{
                bgcolor: '#95A37F',
                color: '#FFFFFF',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#6D7A5C',
                },
                '&:focus': {
                  outline: '2px solid #95A37F',
                  outlineOffset: 2,
                },
              }}
            >
              Mark All as Read
            </Button>
          </Box>
        )}

        {/* Scrollable Notifications List */}
        <Box
          sx={{
            maxHeight: 'calc(100vh - 380px)',
            minHeight: '400px',
            overflowY: 'auto',
            border: '2px solid #95A37F',
            borderTop: 'none',
            '&:focus-within': {
              outline: '2px solid #95A37F',
              outlineOffset: 2,
            },
          }}
        >
          {filteredNotifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <NotificationsIcon sx={{ fontSize: 64, color: '#BDBDBD', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No notifications to display
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredNotifications.map((notif, index) => (
                <Box key={notif.id}>
                  <ListItem
                    sx={{
                      bgcolor: notif.read ? 'transparent' : '#95A37F10',
                      py: 2.5,
                      px: 3,
                      pl: notif.read ? 3 : 5,
                      position: 'relative',
                      alignItems: 'flex-start',
                      '&:hover': {
                        bgcolor: notif.read ? '#F5F5F5' : '#95A37F20',
                      },
                      '&:focus-within': {
                        outline: '2px solid #95A37F',
                        outlineOffset: -2,
                        zIndex: 1,
                      },
                    }}
                  >
                    {/* Unread Indicator */}
                    {!notif.read && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 16,
                          top: 24,
                        }}
                      >
                        <CircleIcon
                          sx={{
                            fontSize: 10,
                            color: '#95A37F',
                          }}
                        />
                      </Box>
                    )}

                    {/* Icon */}
                    <ListItemIcon sx={{ minWidth: 44, mt: 0.5 }}>
                      {getNotificationIcon(notif.type)}
                    </ListItemIcon>

                    {/* Content */}
                    <ListItemText
                      sx={{ my: 0, flex: 1, mr: 2 }}
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: notif.read ? 500 : 700,
                              flex: 1,
                              minWidth: 200,
                              lineHeight: 1.5,
                            }}
                          >
                            {notif.title}
                          </Typography>
                          <Chip
                            icon={getCategoryIcon(notif.category)}
                            label={notif.category.toUpperCase()}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              bgcolor: '#E0E0E0',
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: 'block',
                              mb: 1,
                              fontWeight: notif.read ? 400 : 500,
                              lineHeight: 1.6,
                            }}
                          >
                            {notif.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#9E9E9E',
                              fontWeight: 500,
                              fontSize: '0.75rem',
                            }}
                          >
                            {formatDate(notif.date)}
                          </Typography>
                        </Box>
                      }
                    />

                    {/* Actions */}
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 1, 
                        alignItems: { xs: 'stretch', sm: 'flex-start' },
                        mt: { xs: 1, sm: 0.5 },
                        minWidth: { xs: 'auto', sm: 'fit-content' },
                      }}
                    >
                      {!notif.read && (
                        <Button
                          size="small"
                          onClick={() => handleMarkAsRead(notif.id)}
                          sx={{
                            color: '#95A37F',
                            fontWeight: 600,
                            minWidth: 'auto',
                            px: 1.5,
                            py: 0.5,
                            whiteSpace: 'nowrap',
                            '&:focus': {
                              outline: '2px solid #95A37F',
                              outlineOffset: 2,
                            },
                          }}
                        >
                          Mark Read
                        </Button>
                      )}
                      {notif.actionUrl && (
                        <Button
                          size="small"
                          variant="outlined"
                          href={notif.actionUrl}
                          sx={{
                            borderColor: '#95A37F',
                            color: '#95A37F',
                            fontWeight: 600,
                            px: 1.5,
                            py: 0.5,
                            whiteSpace: 'nowrap',
                            '&:hover': {
                              borderColor: '#6D7A5C',
                              bgcolor: '#95A37F10',
                            },
                            '&:focus': {
                              outline: '2px solid #95A37F',
                              outlineOffset: 2,
                            },
                          }}
                        >
                          View
                        </Button>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(notif.id)}
                        sx={{
                          color: '#d32f2f',
                          alignSelf: { xs: 'center', sm: 'flex-start' },
                          '&:focus': {
                            outline: '2px solid #95A37F',
                            outlineOffset: 2,
                          },
                        }}
                        aria-label="Delete notification"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItem>
                  {index < filteredNotifications.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </Box>
      </Paper>
    </Box>
  )
}

