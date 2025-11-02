import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Divider,
  Badge,
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  School as ScholarshipIcon,
  Notifications as NotificationsIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'

// Types
interface ScholarshipApplication {
  id: string
  scholarshipName: string
  status: 'draft' | 'submitted' | 'under-review' | 'approved' | 'rejected' | 'disbursed'
  submittedDate?: string
  amount?: number
  progress: number
  checklist: ChecklistItem[]
  documents: UploadedDocument[]
  notifications: Notification[]
}

interface ChecklistItem {
  id: string
  label: string
  completed: boolean
  required: boolean
}

interface UploadedDocument {
  id: string
  name: string
  type: string
  uploadDate: string
  ocrStatus: 'processing' | 'completed' | 'failed' | 'pending'
  ocrConfidence?: number
  extractedData?: Record<string, string>
  editable: boolean
  status: 'pending' | 'approved' | 'rejected' | 'resubmission-required'
  rejectionReason?: string
}

interface Notification {
  id: string
  type: 'warning' | 'info' | 'error' | 'success'
  message: string
  date: string
  read: boolean
  actionRequired?: boolean
}

const SCHOLARSHIP_TYPES = [
  'Merit-Based Scholarship',
  'Need-Based Scholarship',
  'Sports Scholarship',
  'Cultural Scholarship',
  'Minority Scholarship',
  'Government Scholarship',
  'Private Scholarship',
]

const DOCUMENT_TYPES = [
  'Income Certificate',
  'Caste Certificate',
  'Previous Year Marksheet',
  'Bank Passbook',
  'Aadhaar Card',
  'Domicile Certificate',
  'Fee Receipt',
  'Bonafide Certificate',
]

export default function ScholarshipPage() {
  const { palette } = useTheme()
  const [activeStep, setActiveStep] = useState(0)
  const [selectedScholarship, setSelectedScholarship] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [editDocumentDialog, setEditDocumentDialog] = useState<UploadedDocument | null>(null)
  const [resubmitDialog, setResubmitDialog] = useState<UploadedDocument | null>(null)
  
  // Mock application data
  const [application, setApplication] = useState<ScholarshipApplication>({
    id: 'SCH-2024-001',
    scholarshipName: 'Merit-Based Scholarship',
    status: 'under-review',
    submittedDate: '2024-10-15',
    amount: 50000,
    progress: 65,
    checklist: [
      { id: '1', label: 'Fill Personal Information', completed: true, required: true },
      { id: '2', label: 'Fill Academic Details', completed: true, required: true },
      { id: '3', label: 'Upload Income Certificate', completed: true, required: true },
      { id: '4', label: 'Upload Marksheet', completed: true, required: true },
      { id: '5', label: 'Upload Bank Details', completed: false, required: true },
      { id: '6', label: 'Upload Caste Certificate', completed: false, required: false },
      { id: '7', label: 'Submit Application', completed: false, required: true },
    ],
    documents: [
      {
        id: 'doc1',
        name: 'Income_Certificate.pdf',
        type: 'Income Certificate',
        uploadDate: '2024-10-12',
        ocrStatus: 'completed',
        ocrConfidence: 95,
        extractedData: {
          'Document Number': 'INC/2024/12345',
          'Annual Income': '₹2,50,000',
          'Issue Date': '2024-09-15',
        },
        editable: true,
        status: 'approved',
      },
      {
        id: 'doc2',
        name: 'Marksheet_2023.pdf',
        type: 'Previous Year Marksheet',
        uploadDate: '2024-10-13',
        ocrStatus: 'completed',
        ocrConfidence: 88,
        extractedData: {
          'Student Name': 'John Doe',
          'Roll Number': 'CS/2023/123',
          'CGPA': '8.5',
        },
        editable: true,
        status: 'resubmission-required',
        rejectionReason: 'Marksheet clarity is poor. Please upload a clearer scan.',
      },
      {
        id: 'doc3',
        name: 'Aadhaar_Card.pdf',
        type: 'Aadhaar Card',
        uploadDate: '2024-10-14',
        ocrStatus: 'processing',
        editable: false,
        status: 'pending',
      },
    ],
    notifications: [
      {
        id: 'notif1',
        type: 'warning',
        message: 'Bank passbook document is missing. Please upload to proceed.',
        date: '2024-10-20',
        read: false,
        actionRequired: true,
      },
      {
        id: 'notif2',
        type: 'error',
        message: 'Marksheet requires resubmission due to poor quality.',
        date: '2024-10-19',
        read: false,
        actionRequired: true,
      },
      {
        id: 'notif3',
        type: 'success',
        message: 'Income certificate has been approved.',
        date: '2024-10-18',
        read: true,
        actionRequired: false,
      },
      {
        id: 'notif4',
        type: 'info',
        message: 'Your application is currently under review by the scholarship committee.',
        date: '2024-10-16',
        read: true,
        actionRequired: false,
      },
    ],
  })

  const [formData, setFormData] = useState({
    fullName: '',
    rollNumber: '',
    program: '',
    year: '',
    email: '',
    phone: '',
    cgpa: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    familyIncome: '',
  })

  const unreadNotifications = application.notifications.filter(n => !n.read).length

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleChecklistToggle = (itemId: string) => {
    setApplication(prev => ({
      ...prev,
      checklist: prev.checklist.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      ),
    }))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Simulate batch upload with OCR processing
    const newDocuments: UploadedDocument[] = Array.from(files).map((file, index) => ({
      id: `doc-${Date.now()}-${index}`,
      name: file.name,
      type: docType,
      uploadDate: new Date().toISOString().split('T')[0],
      ocrStatus: 'processing',
      editable: false,
      status: 'pending',
    }))

    setApplication(prev => ({
      ...prev,
      documents: [...prev.documents, ...newDocuments],
    }))

    // Simulate OCR completion after 3 seconds
    setTimeout(() => {
      setApplication(prev => ({
        ...prev,
        documents: prev.documents.map(doc =>
          newDocuments.find(nd => nd.id === doc.id)
            ? {
                ...doc,
                ocrStatus: 'completed',
                ocrConfidence: Math.floor(Math.random() * 20) + 80,
                editable: true,
                extractedData: {
                  'Document Field 1': 'Sample Data',
                  'Document Field 2': 'Sample Data',
                },
              }
            : doc
        ),
      }))
    }, 3000)
  }

  const handleEditDocument = (doc: UploadedDocument) => {
    setEditDocumentDialog(doc)
  }

  const handleSaveDocumentEdit = () => {
    if (!editDocumentDialog) return
    
    setApplication(prev => ({
      ...prev,
      documents: prev.documents.map(doc =>
        doc.id === editDocumentDialog.id ? editDocumentDialog : doc
      ),
    }))
    setEditDocumentDialog(null)
  }

  const handleResubmitConfirm = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!resubmitDialog) return
    
    const file = event.target.files?.[0]
    if (!file) return

    setApplication(prev => ({
      ...prev,
      documents: prev.documents.map(doc =>
        doc.id === resubmitDialog.id
          ? {
              ...doc,
              name: file.name,
              uploadDate: new Date().toISOString().split('T')[0],
              ocrStatus: 'processing',
              status: 'pending',
              rejectionReason: undefined,
            }
          : doc
      ),
    }))

    setResubmitDialog(null)

    // Simulate OCR processing
    setTimeout(() => {
      setApplication(prev => ({
        ...prev,
        documents: prev.documents.map(doc =>
          doc.id === resubmitDialog.id
            ? {
                ...doc,
                ocrStatus: 'completed',
                ocrConfidence: 92,
                editable: true,
              }
            : doc
        ),
      }))
    }, 3000)
  }

  const handleDeleteDocument = (docId: string) => {
    setApplication(prev => ({
      ...prev,
      documents: prev.documents.filter(doc => doc.id !== docId),
    }))
  }

  const handleMarkNotificationRead = (notifId: string) => {
    setApplication(prev => ({
      ...prev,
      notifications: prev.notifications.map(notif =>
        notif.id === notifId ? { ...notif, read: true } : notif
      ),
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'disbursed':
        return "#2e7d32"
      case 'under-review':
      case 'submitted':
        return "#0288d1"
      case 'rejected':
        return "#d32f2f"
      case 'pending':
        return "#ed6c02"
      case 'resubmission-required':
        return "#d32f2f"
      default:
        return palette.grey[500]
    }
  }

  const getOcrStatusChip = (doc: UploadedDocument) => {
    switch (doc.ocrStatus) {
      case 'processing':
        return (
          <Chip
            icon={<ScheduleIcon />}
            label="Processing OCR..."
            size="small"
            sx={{
              bgcolor: "#ed6c02" + '20',
              color: "#ed6c02",
              fontWeight: 600,
              border: `1px solid ${"#ed6c02"}`,
            }}
          />
        )
      case 'completed':
        return (
          <Chip
            icon={<CheckCircleOutlineIcon />}
            label={`OCR Complete (${doc.ocrConfidence}%)`}
            size="small"
            sx={{
              bgcolor: "#95A37F" + '20',
              color: "#95A37F",
              fontWeight: 600,
              border: `1px solid ${"#95A37F"}`,
            }}
          />
        )
      case 'failed':
        return (
          <Chip
            icon={<CancelIcon />}
            label="OCR Failed"
            size="small"
            sx={{
              bgcolor: "#d32f2f" + '20',
              color: "#d32f2f",
              fontWeight: 600,
              border: `1px solid ${"#d32f2f"}`,
            }}
          />
        )
      default:
        return (
          <Chip
            icon={<PendingIcon />}
            label="Pending OCR"
            size="small"
            sx={{
              bgcolor: palette.grey[200],
              color: palette.grey[700],
              fontWeight: 600,
            }}
          />
        )
    }
  }

  const getDocumentStatusChip = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Chip
            icon={<CheckIcon />}
            label="Approved"
            size="small"
            sx={{
              bgcolor: "#2e7d32" + '20',
              color: "#2e7d32",
              fontWeight: 600,
              border: `1px solid ${"#2e7d32"}`,
            }}
          />
        )
      case 'rejected':
        return (
          <Chip
            icon={<CancelIcon />}
            label="Rejected"
            size="small"
            sx={{
              bgcolor: "#d32f2f" + '20',
              color: "#d32f2f",
              fontWeight: 600,
              border: `1px solid ${"#d32f2f"}`,
            }}
          />
        )
      case 'resubmission-required':
        return (
          <Chip
            icon={<RefreshIcon />}
            label="Resubmit Required"
            size="small"
            sx={{
              bgcolor: "#d32f2f" + '20',
              color: "#d32f2f",
              fontWeight: 600,
              border: `1px solid ${"#d32f2f"}`,
            }}
          />
        )
      case 'pending':
        return (
          <Chip
            icon={<PendingIcon />}
            label="Under Review"
            size="small"
            sx={{
              bgcolor: "#ed6c02" + '20',
              color: "#ed6c02",
              fontWeight: 600,
              border: `1px solid ${"#ed6c02"}`,
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#95A37F", mb: 0.5 }}>
            <ScholarshipIcon sx={{ fontSize: 32, verticalAlign: 'middle', mr: 1 }} />
            Scholarship Application
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Apply for scholarships and track your application status
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Badge badgeContent={unreadNotifications} color="error"><NotificationsIcon /></Badge>}
          onClick={() => setNotificationsOpen(true)}
          sx={{
            borderColor: "#95A37F",
            color: "#95A37F",
            fontWeight: 600,
            '&:hover': {
              borderColor: "#6D7A5C",
              bgcolor: 'transparent',
            },
          }}
        >
          Notifications
        </Button>
      </Box>

      {/* Status Overview */}
      <Paper sx={{ p: 3, mb: 3, border: `2px solid ${"#95A37F"}` }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Application Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip
                label={application.status.toUpperCase().replace('-', ' ')}
                sx={{
                  bgcolor: getStatusColor(application.status),
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: '0.875rem',
                }}
              />
              <Typography variant="body2" color="text.secondary">
                Application ID: {application.id}
              </Typography>
              {application.submittedDate && (
                <Typography variant="body2" color="text.secondary">
                  Submitted: {new Date(application.submittedDate).toLocaleDateString()}
                </Typography>
              )}
            </Box>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Overall Progress
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#95A37F" }}>
                  {application.progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={application.progress}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    bgcolor: "#95A37F",
                    borderRadius: 5,
                  },
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: "#95A37F" + '10', border: `1px solid ${"#95A37F"}` }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Scholarship Amount
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: "#95A37F" }}>
                  ₹{application.amount?.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Main Application Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Application Form
            </Typography>

            <Stepper activeStep={activeStep} orientation="vertical">
              {/* Step 1: Scholarship Selection */}
              <Step>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      '&.Mui-active': { color: "#95A37F" },
                      '&.Mui-completed': { color: "#95A37F" },
                    },
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }}>Select Scholarship</Typography>
                </StepLabel>
                <StepContent>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Scholarship Type</InputLabel>
                    <Select
                      value={selectedScholarship}
                      onChange={(e) => setSelectedScholarship(e.target.value)}
                      label="Scholarship Type"
                      sx={{
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: "#95A37F",
                          borderWidth: 2,
                        },
                      }}
                    >
                      {SCHOLARSHIP_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!selectedScholarship}
                      sx={{
                        bgcolor: "#95A37F",
                        color: "#FFFFFF",
                        fontWeight: 600,
                        '&:hover': { bgcolor: "#6D7A5C" },
                      }}
                    >
                      Continue
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Step 2: Personal Information */}
              <Step>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      '&.Mui-active': { color: "#95A37F" },
                      '&.Mui-completed': { color: "#95A37F" },
                    },
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }}>Personal Information</Typography>
                </StepLabel>
                <StepContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: "#95A37F",
                            borderWidth: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Roll Number"
                        value={formData.rollNumber}
                        onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: "#95A37F",
                            borderWidth: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: "#95A37F",
                            borderWidth: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: "#95A37F",
                            borderWidth: 2,
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button onClick={handleBack}>Back</Button>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{
                        bgcolor: "#95A37F",
                        color: "#FFFFFF",
                        fontWeight: 600,
                        '&:hover': { bgcolor: "#6D7A5C" },
                      }}
                    >
                      Continue
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Step 3: Academic Details */}
              <Step>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      '&.Mui-active': { color: "#95A37F" },
                      '&.Mui-completed': { color: "#95A37F" },
                    },
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }}>Academic Details</Typography>
                </StepLabel>
                <StepContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Program"
                        value={formData.program}
                        onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: "#95A37F",
                            borderWidth: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Current Year"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: "#95A37F",
                            borderWidth: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="CGPA"
                        value={formData.cgpa}
                        onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: "#95A37F",
                            borderWidth: 2,
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button onClick={handleBack}>Back</Button>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{
                        bgcolor: "#95A37F",
                        color: "#FFFFFF",
                        fontWeight: 600,
                        '&:hover': { bgcolor: "#6D7A5C" },
                      }}
                    >
                      Continue
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Step 4: Document Upload */}
              <Step>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      '&.Mui-active': { color: "#95A37F" },
                      '&.Mui-completed': { color: "#95A37F" },
                    },
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }}>Upload Documents</Typography>
                </StepLabel>
                <StepContent>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Upload all required documents. OCR will automatically extract information from your documents.
                  </Alert>

                  {/* Batch Upload Section */}
                  <Box
                    sx={{
                      border: `2px dashed ${"#95A37F"}`,
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      mb: 3,
                      bgcolor: "#95A37F" + '08',
                    }}
                  >
                    <UploadIcon sx={{ fontSize: 48, color: "#95A37F", mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      Batch Upload Documents
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Select document type and upload multiple files at once
                    </Typography>
                    <FormControl sx={{ minWidth: 200, mb: 2 }}>
                      <InputLabel>Document Type</InputLabel>
                      <Select
                        defaultValue=""
                        label="Document Type"
                        sx={{
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: "#95A37F",
                            borderWidth: 2,
                          },
                        }}
                      >
                        {DOCUMENT_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Box>
                      <Button
                        variant="contained"
                        component="label"
                        startIcon={<UploadIcon />}
                        sx={{
                          bgcolor: "#95A37F",
                          color: "#FFFFFF",
                          fontWeight: 600,
                          '&:hover': { bgcolor: "#6D7A5C" },
                        }}
                      >
                        Select Files
                        <input
                          type="file"
                          hidden
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'Income Certificate')}
                        />
                      </Button>
                    </Box>
                  </Box>

                  {/* Uploaded Documents List */}
                  {application.documents.length > 0 && (
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        Uploaded Documents ({application.documents.length})
                      </Typography>
                      <Grid container spacing={2}>
                        {application.documents.map((doc) => (
                          <Grid item xs={12} key={doc.id}>
                            <Card
                              sx={{
                                border: doc.status === 'resubmission-required' 
                                  ? `2px solid ${"#d32f2f"}`
                                  : `1px solid ${palette.grey[300]}`,
                              }}
                            >
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                      {doc.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                      <Chip label={doc.type} size="small" />
                                      {getOcrStatusChip(doc)}
                                      {getDocumentStatusChip(doc.status)}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                      Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    {doc.editable && (
                                      <Tooltip title="Edit Extracted Data">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleEditDocument(doc)}
                                          sx={{ color: "#95A37F" }}
                                        >
                                          <EditIcon />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                    {doc.status === 'resubmission-required' && (
                                      <Tooltip title="Resubmit Document">
                                        <IconButton
                                          size="small"
                                          component="label"
                                          sx={{ color: "#d32f2f" }}
                                        >
                                          <RefreshIcon />
                                          <input
                                            type="file"
                                            hidden
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={handleResubmitConfirm}
                                          />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                    <Tooltip title="Delete">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteDocument(doc.id)}
                                        sx={{ color: "#d32f2f" }}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>

                                {doc.rejectionReason && (
                                  <Alert severity="error" sx={{ mt: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      Resubmission Required:
                                    </Typography>
                                    <Typography variant="body2">
                                      {doc.rejectionReason}
                                    </Typography>
                                  </Alert>
                                )}

                                {doc.extractedData && doc.ocrStatus === 'completed' && (
                                  <Box sx={{ mt: 2, p: 2, bgcolor: palette.grey[50], borderRadius: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                                      Extracted Information:
                                    </Typography>
                                    <Grid container spacing={1}>
                                      {Object.entries(doc.extractedData).map(([key, value]) => (
                                        <Grid item xs={12} sm={6} key={key}>
                                          <Typography variant="caption" color="text.secondary">
                                            {key}:
                                          </Typography>
                                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {value}
                                          </Typography>
                                        </Grid>
                                      ))}
                                    </Grid>
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                    <Button onClick={handleBack}>Back</Button>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{
                        bgcolor: "#95A37F",
                        color: "#FFFFFF",
                        fontWeight: 600,
                        '&:hover': { bgcolor: "#6D7A5C" },
                      }}
                    >
                      Continue
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Step 5: Bank Details */}
              <Step>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      '&.Mui-active': { color: "#95A37F" },
                      '&.Mui-completed': { color: "#95A37F" },
                    },
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }}>Bank Details</Typography>
                </StepLabel>
                <StepContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Bank Name"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: "#95A37F",
                            borderWidth: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Account Number"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: "#95A37F",
                            borderWidth: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="IFSC Code"
                        value={formData.ifscCode}
                        onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                        sx={{
                          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: "#95A37F",
                            borderWidth: 2,
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button onClick={handleBack}>Back</Button>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{
                        bgcolor: "#95A37F",
                        color: "#FFFFFF",
                        fontWeight: 600,
                        '&:hover': { bgcolor: "#6D7A5C" },
                      }}
                    >
                      Continue
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Step 6: Review & Submit */}
              <Step>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      '&.Mui-active': { color: "#95A37F" },
                      '&.Mui-completed': { color: "#95A37F" },
                    },
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }}>Review & Submit</Typography>
                </StepLabel>
                <StepContent>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Please review your application before final submission.
                  </Alert>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button onClick={handleBack}>Back</Button>
                    <Button
                      variant="contained"
                      sx={{
                        bgcolor: "#95A37F",
                        color: "#FFFFFF",
                        fontWeight: 600,
                        '&:hover': { bgcolor: "#6D7A5C" },
                      }}
                    >
                      Submit Application
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            </Stepper>
          </Paper>
        </Grid>

        {/* Sidebar - Checklist */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Application Checklist
            </Typography>
            <List>
              {application.checklist.map((item) => (
                <ListItem
                  key={item.id}
                  dense
                  sx={{
                    mb: 1,
                    bgcolor: item.completed ? "#95A37F" + '10' : 'transparent',
                    borderRadius: 1,
                    border: `1px solid ${item.completed ? "#95A37F" : palette.grey[300]}`,
                  }}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={item.completed}
                      onChange={() => handleChecklistToggle(item.id)}
                      sx={{
                        color: "#95A37F",
                        '&.Mui-checked': { color: "#95A37F" },
                      }}
                      icon={<UncheckedIcon />}
                      checkedIcon={<CheckIcon />}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    secondary={item.required ? 'Required' : 'Optional'}
                    primaryTypographyProps={{
                      fontWeight: item.completed ? 600 : 400,
                      sx: { textDecoration: item.completed ? 'line-through' : 'none' },
                    }}
                    secondaryTypographyProps={{
                      color: item.required ? "#d32f2f" : "#757575",
                      fontWeight: item.required ? 600 : 400,
                      fontSize: '0.75rem',
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Notifications Dialog */}
      <Dialog
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Notifications
            </Typography>
            <Chip
              label={`${unreadNotifications} Unread`}
              size="small"
              color="error"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {application.notifications.map((notif) => (
              <Box key={notif.id}>
                <ListItem
                  sx={{
                    bgcolor: notif.read ? 'transparent' : "#95A37F" + '08',
                    borderRadius: 1,
                    mb: 1,
                    border: notif.actionRequired ? `2px solid ${"#d32f2f"}` : 'none',
                  }}
                >
                  <ListItemIcon>
                    {notif.type === 'warning' && <WarningIcon color="warning" />}
                    {notif.type === 'error' && <WarningIcon color="error" />}
                    {notif.type === 'success' && <CheckIcon color="success" />}
                    {notif.type === 'info' && <InfoIcon color="info" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={notif.message}
                    secondary={new Date(notif.date).toLocaleDateString()}
                    primaryTypographyProps={{
                      fontWeight: notif.read ? 400 : 600,
                    }}
                  />
                  {!notif.read && (
                    <Button
                      size="small"
                      onClick={() => handleMarkNotificationRead(notif.id)}
                      sx={{ color: "#95A37F", fontWeight: 600 }}
                    >
                      Mark Read
                    </Button>
                  )}
                </ListItem>
                <Divider />
              </Box>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setNotificationsOpen(false)}
            sx={{
              bgcolor: "#95A37F",
              color: "#FFFFFF",
              fontWeight: 600,
              '&:hover': { bgcolor: "#6D7A5C" },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog
        open={!!editDocumentDialog}
        onClose={() => setEditDocumentDialog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Edit Extracted Data
          </Typography>
        </DialogTitle>
        <DialogContent>
          {editDocumentDialog?.extractedData && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {Object.entries(editDocumentDialog.extractedData).map(([key, value]) => (
                <Grid item xs={12} sm={6} key={key}>
                  <TextField
                    fullWidth
                    label={key}
                    defaultValue={value}
                    onChange={(e) => {
                      setEditDocumentDialog({
                        ...editDocumentDialog,
                        extractedData: {
                          ...editDocumentDialog.extractedData!,
                          [key]: e.target.value,
                        },
                      })
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: "#95A37F",
                        borderWidth: 2,
                      },
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDocumentDialog(null)}>Cancel</Button>
          <Button
            onClick={handleSaveDocumentEdit}
            variant="contained"
            sx={{
              bgcolor: "#95A37F",
              color: "#FFFFFF",
              fontWeight: 600,
              '&:hover': { bgcolor: "#6D7A5C" },
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}


