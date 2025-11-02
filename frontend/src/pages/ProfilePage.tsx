import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Avatar,
  Button,
  TextField,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Tooltip,
  Divider,
  Alert,
  LinearProgress,
  Tab,
  Tabs,
  Switch,
  FormControlLabel,
  FormGroup,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  Edit as EditIcon,
  Save as SaveIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  School as SchoolIcon,
  Event as EventIcon,
  Security as SecurityIcon,
} from '@mui/icons-material'

interface Document {
  id: number
  name: string
  type: string
  size: string
  uploadedAt: string
  status: 'verified' | 'failed' | 'needs-action' | 'pending'
  category: string
  ocrStatus?: 'success' | 'failed' | 'processing'
  ocrConfidence?: number
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

interface NotificationPreferences {
  emailNotifications: boolean
  requestUpdates: boolean
  systemAlerts: boolean
  scholarshipAlerts: boolean
  eventReminders: boolean
  documentExpiry: boolean
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

// Mock user data
const mockUser = {
  name: 'John Doe',
  email: 'john.doe@vnrvjiet.in',
  studentId: 'STU2024001',
  phone: '+91 98765 43210',
  department: 'Computer Science and Engineering',
  enrollmentYear: '2023',
  semester: '4th Semester',
  section: 'CSE-A',
  avatar: 'JD',
}

// Mock documents data
const mockDocuments: Document[] = [
  {
    id: 1,
    name: 'Aadhar_Card.pdf',
    type: 'pdf',
    size: '245 KB',
    uploadedAt: '2024-01-15',
    status: 'verified',
    category: 'Identity',
    ocrStatus: 'success',
    ocrConfidence: 98,
  },
  {
    id: 2,
    name: 'Fee_Receipt_Sem4.pdf',
    type: 'pdf',
    size: '180 KB',
    uploadedAt: '2024-01-10',
    status: 'verified',
    category: 'Financial',
    ocrStatus: 'success',
    ocrConfidence: 95,
  },
  {
    id: 3,
    name: 'Passport_Photo.jpg',
    type: 'image',
    size: '120 KB',
    uploadedAt: '2024-01-05',
    status: 'verified',
    category: 'Identity',
  },
  {
    id: 4,
    name: 'Income_Certificate.pdf',
    type: 'pdf',
    size: '320 KB',
    uploadedAt: '2023-12-20',
    status: 'needs-action',
    category: 'Financial',
    ocrStatus: 'failed',
  },
  {
    id: 5,
    name: 'Marksheet_Sem3.pdf',
    type: 'pdf',
    size: '280 KB',
    uploadedAt: '2023-12-15',
    status: 'pending',
    category: 'Academic',
    ocrStatus: 'processing',
  },
]

const getFileIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'pdf':
      return <PdfIcon sx={{ fontSize: 40, color: '#d32f2f' }} />
    case 'image':
    case 'jpg':
    case 'jpeg':
    case 'png':
      return <ImageIcon sx={{ fontSize: 40, color: '#1976d2' }} />
    default:
      return <FileIcon sx={{ fontSize: 40, color: '#757575' }} />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'verified':
      return '#2e7d32'
    case 'failed':
      return '#d32f2f'
    case 'needs-action':
      return '#ed6c02'
    case 'pending':
      return '#0288d1'
    default:
      return '#757575'
  }
}

const getStatusBgColor = (status: string) => {
  switch (status) {
    case 'verified':
      return '#e8f5e9'
    case 'failed':
      return '#ffebee'
    case 'needs-action':
      return '#fff3e0'
    case 'pending':
      return '#e3f2fd'
    default:
      return '#f5f5f5'
  }
}

const getOCRBadge = (ocrStatus?: string, confidence?: number) => {
  if (ocrStatus === 'processing') {
    return {
      icon: <WarningIcon fontSize="small" />,
      color: '#0288d1',
      bgColor: '#e3f2fd',
      text: 'Processing',
    }
  }
  if (ocrStatus === 'success' && confidence) {
    return {
      icon: <CheckCircleIcon fontSize="small" />,
      color: confidence >= 90 ? '#2e7d32' : '#ed6c02',
      bgColor: confidence >= 90 ? '#e8f5e9' : '#fff3e0',
      text: `${confidence}% OCR`,
    }
  }
  if (ocrStatus === 'failed') {
    return {
      icon: <ErrorIcon fontSize="small" />,
      color: '#d32f2f',
      bgColor: '#ffebee',
      text: 'OCR Failed',
    }
  }
  return null
}

export default function ProfilePage() {
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  
  // Map tab names to indices: profile=0, documents=1, notifications=2, security=3
  const getInitialTab = () => {
    switch (tabParam) {
      case 'documents':
        return 1
      case 'notifications':
        return 2
      case 'security':
        return 3
      default:
        return 0
    }
  }
  
  const [tabValue, setTabValue] = useState(getInitialTab())
  const [isEditing, setIsEditing] = useState(false)
  const [userInfo, setUserInfo] = useState(mockUser)
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // Password states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  
  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    emailNotifications: true,
    requestUpdates: true,
    systemAlerts: true,
    scholarshipAlerts: true,
    eventReminders: false,
    documentExpiry: true,
  })
  
  // Update tab when URL parameter changes
  useEffect(() => {
    setTabValue(getInitialTab())
  }, [tabParam])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleEditToggle = () => {
    setIsEditing(!isEditing)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      handleFileUpload(file)
    }
  }

  const handleFileUpload = (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          
          // Add new document
          const newDoc: Document = {
            id: documents.length + 1,
            name: file.name,
            type: file.type.includes('pdf') ? 'pdf' : 'image',
            size: `${Math.round(file.size / 1024)} KB`,
            uploadedAt: new Date().toISOString().split('T')[0],
            status: 'pending',
            category: 'General',
            ocrStatus: 'processing',
          }
          setDocuments([newDoc, ...documents])
          setUploadDialogOpen(false)
          setSelectedFile(null)
          
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const handlePasswordChange = () => {
    setPasswordError('')
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required')
      return
    }
    
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    
    // Success
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    alert('Password changed successfully!')
  }

  const handleNotificationToggle = (key: keyof NotificationPreferences) => {
    setNotificationPrefs({ ...notificationPrefs, [key]: !notificationPrefs[key] })
  }

  const handleDeleteDocument = (id: number) => {
    setDocuments(documents.filter((doc) => doc.id !== id))
  }

  const handleDownloadDocument = (doc: Document) => {
    alert(`Downloading ${doc.name}`)
  }

  const getDocumentStats = () => {
    return {
      total: documents.length,
      verified: documents.filter((d) => d.status === 'verified').length,
      pending: documents.filter((d) => d.status === 'pending').length,
      needsAction: documents.filter((d) => d.status === 'needs-action').length,
    }
  }

  const stats = getDocumentStats()

  const oliveFocusStyle = {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: '#95A37F',
        borderWidth: '2px',
      },
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#95A37F',
    },
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              minWidth: 120,
            },
            '& .Mui-selected': {
              color: '#95A37F',
              fontWeight: 600,
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#95A37F',
              height: 3,
            },
          }}
        >
          <Tab label="Profile Information" icon={<EditIcon />} iconPosition="start" />
          <Tab label="Documents" icon={<DescriptionIcon />} iconPosition="start" />
          <Tab label="Notifications" icon={<NotificationsIcon />} iconPosition="start" />
          <Tab label="Security" icon={<SecurityIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Profile Information Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: '#95A37F',
                      color: 'white',
                      width: 32,
                      height: 32,
                      '&:hover': { bgcolor: '#7a8566' },
                      '&:focus': { outline: '2px solid #95A37F', outlineOffset: 2 },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                }
              >
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    bgcolor: '#95A37F',
                    fontSize: '2.5rem',
                    fontWeight: 600,
                  }}
                >
                  {userInfo.avatar}
                </Avatar>
              </Badge>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, mt: 2 }}>
                {userInfo.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {userInfo.email}
              </Typography>
              <Chip
                label={`ID: ${userInfo.studentId}`}
                sx={{
                  bgcolor: '#e8f0e0',
                  color: '#636b2f',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: '2px solid #95A37F',
                }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#95A37F' }}>
                  Personal Information
                </Typography>
                <Button
                  startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
                  onClick={handleEditToggle}
                  sx={{
                    bgcolor: isEditing ? '#95A37F' : 'transparent',
                    color: isEditing ? 'white' : '#95A37F',
                    border: isEditing ? 'none' : '2px solid #95A37F',
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: isEditing ? '#7a8566' : '#e8f0e0',
                    },
                    '&:focus': {
                      outline: '2px solid #95A37F',
                      outlineOffset: 2,
                    },
                  }}
                >
                  {isEditing ? 'Save Changes' : 'Edit Profile'}
                </Button>
              </Box>

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                    disabled={!isEditing}
                    variant="outlined"
                    sx={oliveFocusStyle}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Student ID"
                    value={userInfo.studentId}
                    disabled
                    variant="outlined"
                    sx={oliveFocusStyle}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                    disabled={!isEditing}
                    variant="outlined"
                    sx={oliveFocusStyle}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={userInfo.phone}
                    onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                    disabled={!isEditing}
                    variant="outlined"
                    sx={oliveFocusStyle}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    value={userInfo.department}
                    disabled
                    variant="outlined"
                    sx={oliveFocusStyle}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Enrollment Year"
                    value={userInfo.enrollmentYear}
                    disabled
                    variant="outlined"
                    sx={oliveFocusStyle}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Current Semester"
                    value={userInfo.semester}
                    disabled
                    variant="outlined"
                    sx={oliveFocusStyle}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Section"
                    value={userInfo.section}
                    disabled
                    variant="outlined"
                    sx={oliveFocusStyle}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Documents Tab */}
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#95A37F' }}>
              Document Center
            </Typography>
            <Button
              startIcon={<CloudUploadIcon />}
              onClick={() => setUploadDialogOpen(true)}
              sx={{
                bgcolor: '#95A37F',
                color: 'white',
                px: 3,
                py: 1,
                fontWeight: 600,
                '&:hover': { bgcolor: '#7a8566' },
                '&:focus': { outline: '2px solid #95A37F', outlineOffset: 2 },
              }}
            >
              Upload Document
            </Button>
          </Box>

          {/* Document Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Card sx={{ bgcolor: '#e8f0e0', border: '2px solid #95A37F', borderRadius: 2 }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#636b2f' }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Total Documents
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ bgcolor: '#e8f5e9', border: '1px solid #2e7d32', borderRadius: 2 }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                    {stats.verified}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Verified
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ bgcolor: '#e3f2fd', border: '1px solid #0288d1', borderRadius: 2 }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#0288d1' }}>
                    {stats.pending}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Pending
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ bgcolor: '#fff3e0', border: '1px solid #ed6c02', borderRadius: 2 }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#ed6c02' }}>
                    {stats.needsAction}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Needs Action
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Documents List */}
          <Grid container spacing={2}>
            {documents.map((doc) => {
              const ocrBadge = getOCRBadge(doc.ocrStatus, doc.ocrConfidence)
              return (
                <Grid item xs={12} sm={6} md={4} key={doc.id}>
                  <Card
                    sx={{
                      border: doc.status === 'verified' ? '2px solid #95A37F' : '1px solid #E0E0E0',
                      borderRadius: 2,
                      transition: 'transform 0.2s',
                      '&:focus-within': {
                        outline: '2px solid #95A37F',
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ mr: 2 }}>{getFileIcon(doc.type)}</Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 600,
                              mb: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {doc.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {doc.size}  {doc.uploadedAt}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Chip
                          label={doc.status.replace('-', ' ').toUpperCase()}
                          size="small"
                          sx={{
                            bgcolor: getStatusBgColor(doc.status),
                            color: getStatusColor(doc.status),
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            border: `1.5px solid ${getStatusColor(doc.status)}`,
                          }}
                        />
                        <Chip
                          label={doc.category}
                          size="small"
                          sx={{
                            bgcolor: '#e8f0e0',
                            color: '#636b2f',
                            fontWeight: 500,
                            fontSize: '0.7rem',
                          }}
                        />
                        {ocrBadge && (
                          <Chip
                            icon={ocrBadge.icon}
                            label={ocrBadge.text}
                            size="small"
                            sx={{
                              bgcolor: ocrBadge.bgColor,
                              color: ocrBadge.color,
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              border: `1.5px solid ${ocrBadge.color}`,
                              '& .MuiChip-icon': {
                                color: ocrBadge.color,
                              },
                            }}
                          />
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Download">
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadDocument(doc)}
                            sx={{
                              color: '#95A37F',
                              '&:focus': { outline: '2px solid #95A37F' },
                            }}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteDocument(doc.id)}
                            sx={{
                              color: '#d32f2f',
                              '&:focus': { outline: '2px solid #95A37F' },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        </Paper>
      </TabPanel>

      {/* Notifications Tab */}
      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#95A37F', mb: 3 }}>
            Notification Preferences
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            Manage how you receive notifications about your requests, documents, and system updates.
          </Alert>

          <FormGroup>
            <List>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <EmailIcon sx={{ color: '#95A37F' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Email Notifications"
                  secondary="Receive notifications via email"
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationPrefs.emailNotifications}
                      onChange={() => handleNotificationToggle('emailNotifications')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#95A37F',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#95A37F',
                        },
                        '& .MuiSwitch-switchBase:focus': {
                          outline: '2px solid #95A37F',
                          outlineOffset: 2,
                        },
                      }}
                    />
                  }
                  label=""
                />
              </ListItem>
              <Divider />

              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <DescriptionIcon sx={{ color: '#95A37F' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Request Updates"
                  secondary="Get notified about status changes in your requests"
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationPrefs.requestUpdates}
                      onChange={() => handleNotificationToggle('requestUpdates')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#95A37F',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#95A37F',
                        },
                        '& .MuiSwitch-switchBase:focus': {
                          outline: '2px solid #95A37F',
                          outlineOffset: 2,
                        },
                      }}
                    />
                  }
                  label=""
                />
              </ListItem>
              <Divider />

              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <NotificationsIcon sx={{ color: '#95A37F' }} />
                </ListItemIcon>
                <ListItemText
                  primary="System Alerts"
                  secondary="Important system notifications and announcements"
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationPrefs.systemAlerts}
                      onChange={() => handleNotificationToggle('systemAlerts')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#95A37F',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#95A37F',
                        },
                        '& .MuiSwitch-switchBase:focus': {
                          outline: '2px solid #95A37F',
                          outlineOffset: 2,
                        },
                      }}
                    />
                  }
                  label=""
                />
              </ListItem>
              <Divider />

              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <SchoolIcon sx={{ color: '#95A37F' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Scholarship Alerts"
                  secondary="Notifications about scholarship opportunities"
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationPrefs.scholarshipAlerts}
                      onChange={() => handleNotificationToggle('scholarshipAlerts')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#95A37F',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#95A37F',
                        },
                        '& .MuiSwitch-switchBase:focus': {
                          outline: '2px solid #95A37F',
                          outlineOffset: 2,
                        },
                      }}
                    />
                  }
                  label=""
                />
              </ListItem>
              <Divider />

              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <EventIcon sx={{ color: '#95A37F' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Event Reminders"
                  secondary="Reminders for upcoming events and deadlines"
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationPrefs.eventReminders}
                      onChange={() => handleNotificationToggle('eventReminders')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#95A37F',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#95A37F',
                        },
                        '& .MuiSwitch-switchBase:focus': {
                          outline: '2px solid #95A37F',
                          outlineOffset: 2,
                        },
                      }}
                    />
                  }
                  label=""
                />
              </ListItem>
              <Divider />

              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <WarningIcon sx={{ color: '#95A37F' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Document Expiry Alerts"
                  secondary="Get notified when documents are about to expire"
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationPrefs.documentExpiry}
                      onChange={() => handleNotificationToggle('documentExpiry')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#95A37F',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#95A37F',
                        },
                        '& .MuiSwitch-switchBase:focus': {
                          outline: '2px solid #95A37F',
                          outlineOffset: 2,
                        },
                      }}
                    />
                  }
                  label=""
                />
              </ListItem>
            </List>
          </FormGroup>

          <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #E0E0E0' }}>
            <Button
              variant="contained"
              sx={{
                bgcolor: '#95A37F',
                color: 'white',
                px: 4,
                py: 1,
                fontWeight: 600,
                '&:hover': { bgcolor: '#7a8566' },
                '&:focus': { outline: '2px solid #95A37F', outlineOffset: 2 },
              }}
            >
              Save Preferences
            </Button>
          </Box>
        </Paper>
      </TabPanel>

      {/* Security Tab */}
      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#95A37F', mb: 3 }}>
            Security & Password
          </Typography>

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Choose a strong password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                variant="outlined"
                sx={oliveFocusStyle}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#95A37F' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        edge="end"
                        sx={{
                          '&:focus': { outline: '2px solid #95A37F' },
                        }}
                      >
                        {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                variant="outlined"
                sx={oliveFocusStyle}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#95A37F' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                        sx={{
                          '&:focus': { outline: '2px solid #95A37F' },
                        }}
                      >
                        {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                variant="outlined"
                sx={oliveFocusStyle}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#95A37F' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        sx={{
                          '&:focus': { outline: '2px solid #95A37F' },
                        }}
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {passwordError && (
              <Grid item xs={12}>
                <Alert severity="error">{passwordError}</Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handlePasswordChange}
                  sx={{
                    bgcolor: '#95A37F',
                    color: 'white',
                    px: 4,
                    py: 1,
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#7a8566' },
                    '&:focus': { outline: '2px solid #95A37F', outlineOffset: 2 },
                  }}
                >
                  Change Password
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setCurrentPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                    setPasswordError('')
                  }}
                  sx={{
                    borderColor: '#95A37F',
                    color: '#95A37F',
                    px: 4,
                    py: 1,
                    fontWeight: 600,
                    borderWidth: 2,
                    '&:hover': {
                      borderColor: '#95A37F',
                      bgcolor: '#e8f0e0',
                      borderWidth: 2,
                    },
                    '&:focus': { outline: '2px solid #95A37F', outlineOffset: 2 },
                  }}
                >
                  Reset
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Additional Security Info */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#636b2f' }}>
              Security Tips
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon sx={{ color: '#95A37F', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Use a unique password for your account"
                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon sx={{ color: '#95A37F', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Change your password regularly"
                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon sx={{ color: '#95A37F', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Never share your password with anyone"
                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon sx={{ color: '#95A37F', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary="Log out from shared devices"
                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                />
              </ListItem>
            </List>
          </Box>
        </Paper>
      </TabPanel>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => !isUploading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#95A37F' }}>Upload New Document</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Button
              component="label"
              variant="outlined"
              fullWidth
              startIcon={<CloudUploadIcon />}
              disabled={isUploading}
              sx={{
                py: 6,
                borderStyle: 'dashed',
                borderWidth: 2,
                borderColor: '#95A37F',
                color: '#95A37F',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#95A37F',
                  bgcolor: '#e8f0e0',
                  borderWidth: 2,
                },
                '&:focus': {
                  outline: '2px solid #95A37F',
                  outlineOffset: 2,
                },
              }}
            >
              {isUploading ? 'Uploading...' : 'Click to select file or drag and drop'}
              <input type="file" hidden onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png" />
            </Button>

            {selectedFile && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#e8f0e0', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#636b2f' }}>
                  Selected: {selectedFile.name}
                </Typography>
              </Box>
            )}

            {isUploading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: '#E0E0E0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#95A37F',
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block', textAlign: 'center', fontWeight: 500 }}
                >
                  {uploadProgress}% complete
                </Typography>
              </Box>
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              Supported formats: PDF, JPG, PNG  Max size: 10 MB
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setUploadDialogOpen(false)}
            disabled={isUploading}
            sx={{
              color: '#95A37F',
              '&:focus': { outline: '2px solid #95A37F', outlineOffset: 2 },
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
