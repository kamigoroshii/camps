import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Divider,
} from '@mui/material'
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Description as DescriptionIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  SmartToy as SmartToyIcon,
  PendingActions as PendingActionsIcon,
} from '@mui/icons-material'
import { useFormik } from 'formik'
import * as yup from 'yup'
import { toast } from 'react-toastify'
import { palette } from '../theme'

const steps = ['Request Type', 'Details & Description', 'Upload Documents', 'Review & Submit']

const requestTypes = [
  { value: 'course_registration', label: 'Course Registration' },
  { value: 'grade_appeal', label: 'Grade Appeal' },
  { value: 'transcript', label: 'Transcript Request' },
  { value: 'leave', label: 'Leave of Absence' },
  { value: 'scholarship', label: 'Scholarship Application' },
  { value: 'other', label: 'Other' },
]

const priorityLevels = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  preview?: string
  ocrStatus: 'processing' | 'completed' | 'failed'
  ocrConfidence?: number
}

const validationSchemas = [
  // Step 1: Request Type
  yup.object({
    requestType: yup.string().required('Please select a request type'),
    priority: yup.string().required('Please select a priority level'),
  }),
  // Step 2: Details
  yup.object({
    title: yup.string().required('Title is required').min(5, 'Title must be at least 5 characters'),
    description: yup
      .string()
      .required('Description is required')
      .min(20, 'Please provide a detailed description (at least 20 characters)'),
    additionalInfo: yup.string(),
  }),
  // Step 3: Documents (optional)
  yup.object({}),
  // Step 4: Review
  yup.object({}),
]

export default function CreateRequestPage() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)

  const formik = useFormik({
    initialValues: {
      requestType: '',
      priority: 'medium',
      title: '',
      description: '',
      additionalInfo: '',
    },
    validationSchema: validationSchemas[activeStep],
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      if (activeStep === steps.length - 1) {
        // Final submission
        setIsSubmitting(true)
        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 2000))

          console.log('Form submitted:', values)
          console.log('Uploaded files:', uploadedFiles)

          toast.success('Request submitted successfully!')
          navigate('/requests')
        } catch (error) {
          toast.error('Failed to submit request. Please try again.')
        } finally {
          setIsSubmitting(false)
        }
      } else {
        // Move to next step
        handleNext()
      }
    },
  })

  const handleNext = async () => {
    const errors = await formik.validateForm()
    const currentStepFields = Object.keys(validationSchemas[activeStep].fields)
    const hasCurrentStepErrors = currentStepFields.some((field) => errors[field as keyof typeof errors])

    if (hasCurrentStepErrors) {
      // Mark all fields as touched to show errors
      currentStepFields.forEach((field) => {
        formik.setFieldTouched(field, true)
      })
      toast.error('Please fill in all required fields')
      return
    }

    setActiveStep((prevStep) => prevStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      // Simulate OCR/preview generation
      const reader = new FileReader()
      reader.onloadstart = () => {
        setUploadProgress(0)
      }
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress((e.loaded / e.total) * 100)
        }
      }
      reader.onload = () => {
        const newFile: UploadedFile = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          preview: reader.result as string,
          ocrStatus: 'processing',
        }
        setUploadedFiles((prev) => [...prev, newFile])
        
        // Simulate OCR processing
        setTimeout(() => {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === newFile.id
                ? { ...f, ocrStatus: 'completed' as const, ocrConfidence: Math.floor(Math.random() * 15) + 85 }
                : f
            )
          )
        }, 2000)
        
        setUploadProgress(100)
        setTimeout(() => setUploadProgress(0), 500)
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const generateAiSuggestions = () => {
    // Simulate LangChain RAG AI suggestions
    setShowAiSuggestions(true)
    const suggestions = [
      'Include your student ID and course details in the description',
      'Mention any relevant deadlines or time constraints',
      'Attach supporting documents such as receipts or forms',
      'Provide context about previous related requests if applicable',
    ]
    setAiSuggestions(suggestions)
  }

  const getOcrStatusChip = (file: UploadedFile) => {
    switch (file.ocrStatus) {
      case 'processing':
        return (
          <Chip
            label="Processing OCR..."
            size="small"
            icon={<PendingActionsIcon />}
            sx={{
              bgcolor: `${palette.primary}20`,
              color: palette.primary,
              fontSize: '0.7rem',
              fontWeight: 600,
              border: `1px solid ${palette.primary}`,
            }}
          />
        )
      case 'completed':
        return (
          <Tooltip title={`OCR Confidence: ${file.ocrConfidence}%`} placement="top">
            <Chip
              label={`OCR Complete (${file.ocrConfidence}%)`}
              size="small"
              icon={<CheckCircleIcon />}
              sx={{
                bgcolor: `${palette.success}20`,
                color: palette.success,
                fontSize: '0.7rem',
                fontWeight: 600,
                border: `1px solid ${palette.success}`,
              }}
            />
          </Tooltip>
        )
      case 'failed':
        return (
          <Chip
            label="OCR Failed"
            size="small"
            sx={{
              bgcolor: `${palette.error}20`,
              color: palette.error,
              fontSize: '0.7rem',
              fontWeight: 600,
              border: `1px solid ${palette.error}`,
            }}
          />
        )
    }
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert 
                severity="info" 
                icon={<InfoIcon />} 
                sx={{ 
                  mb: 2,
                  bgcolor: `${palette.info}15`,
                  border: `1px solid ${palette.info}`,
                  '& .MuiAlert-icon': {
                    color: palette.info,
                  },
                }}
              >
                Select the type of request you'd like to submit. Different types may require different documents.
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Request Type"
                name="requestType"
                value={formik.values.requestType}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.requestType && Boolean(formik.errors.requestType)}
                helperText={formik.touched.requestType && formik.errors.requestType}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: palette.primary,
                      borderWidth: 2,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: palette.primary,
                  },
                }}
              >
                {requestTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Priority Level"
                name="priority"
                value={formik.values.priority}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.priority && Boolean(formik.errors.priority)}
                helperText={formik.touched.priority && formik.errors.priority}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: palette.primary,
                      borderWidth: 2,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: palette.primary,
                  },
                }}
              >
                {priorityLevels.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {formik.values.requestType && (
              <Grid item xs={12}>
                <Card 
                  elevation={0}
                  sx={{ 
                    bgcolor: `${palette.primary}10`, 
                    border: `1px solid ${palette.borderLight}`,
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: palette.textPrimary }}>
                      Required Documents:
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleIcon sx={{ fontSize: 18, color: palette.primary }} />
                        </ListItemIcon>
                        <ListItemText primary="Valid Student ID" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleIcon sx={{ fontSize: 18, color: palette.primary }} />
                        </ListItemIcon>
                        <ListItemText primary="Supporting documents (if applicable)" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleIcon sx={{ fontSize: 18, color: palette.primary }} />
                        </ListItemIcon>
                        <ListItemText primary="Any official forms or letters" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )

      case 1:
        return (
          <Grid container spacing={3}>
            {/* AI Suggestions Panel */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: palette.textPrimary }}>
                  Need help? Get AI-powered suggestions
                </Typography>
                <Button
                  size="small"
                  startIcon={<SmartToyIcon />}
                  onClick={generateAiSuggestions}
                  sx={{
                    color: palette.primary,
                    fontWeight: 600,
                    textTransform: 'none',
                  }}
                >
                  Get AI Suggestions
                </Button>
              </Box>
              
              {showAiSuggestions && aiSuggestions.length > 0 && (
                <Card 
                  elevation={0}
                  sx={{ 
                    mb: 2, 
                    bgcolor: `${palette.primary}10`,
                    border: `1px solid ${palette.primary}`,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <SmartToyIcon sx={{ color: palette.primary, fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: palette.primary }}>
                        AI Suggestions (RAG-powered)
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 1.5 }} />
                    <List dense>
                      {aiSuggestions.map((suggestion, index) => (
                        <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircleIcon sx={{ fontSize: 16, color: palette.primary }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={suggestion} 
                            primaryTypographyProps={{ variant: 'body2', color: palette.textSecondary }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Request Title"
                name="title"
                placeholder="e.g., Request for Course Registration - CS 401"
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.title && Boolean(formik.errors.title)}
                helperText={formik.touched.title && formik.errors.title}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: palette.primary,
                      borderWidth: 2,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: palette.primary,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Description"
                name="description"
                placeholder="Provide a detailed description of your request..."
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={
                  (formik.touched.description && formik.errors.description) ||
                  `${formik.values.description.length}/500 characters`
                }
                inputProps={{ maxLength: 500 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: palette.primary,
                      borderWidth: 2,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: palette.primary,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Additional Information (Optional)"
                name="additionalInfo"
                placeholder="Any additional details that might be helpful..."
                value={formik.values.additionalInfo}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: palette.primary,
                      borderWidth: 2,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: palette.primary,
                  },
                }}
              />
            </Grid>
          </Grid>
        )

      case 2:
        return (
          <Box>
            {/* Upload Zone */}
            <Paper
              elevation={0}
              sx={{
                p: 4,
                border: `2px dashed ${palette.primary}`,
                borderRadius: 2,
                textAlign: 'center',
                bgcolor: `${palette.primary}08`,
                cursor: 'pointer',
                mb: 3,
              }}
              component="label"
            >
              <input
                type="file"
                hidden
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
              />
              <CloudUploadIcon sx={{ fontSize: 64, color: palette.primary, mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Upload Documents
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Drag and drop files here or click to browse
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB each)
              </Typography>
            </Paper>

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Uploading...
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Math.round(uploadProgress)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: `${palette.primary}15`,
                    '& .MuiLinearProgress-bar': {
                      bgcolor: palette.primary,
                    },
                  }}
                />
              </Box>
            )}

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Uploaded Files ({uploadedFiles.length})
                </Typography>
                <Grid container spacing={2}>
                  {uploadedFiles.map((file) => (
                    <Grid item xs={12} sm={6} key={file.id}>
                      <Card elevation={0} sx={{ position: 'relative', border: `1px solid ${palette.borderLight}` }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <DescriptionIcon sx={{ fontSize: 40, color: palette.primary }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
                                {file.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                {formatFileSize(file.size)}
                              </Typography>
                              <Box sx={{ mt: 0.5 }}>
                                {getOcrStatusChip(file)}
                              </Box>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveFile(file.id)}
                              sx={{ color: palette.error }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {uploadedFiles.length === 0 && (
              <Alert 
                severity="info" 
                icon={<InfoIcon />}
                sx={{
                  bgcolor: `${palette.info}15`,
                  border: `1px solid ${palette.info}`,
                  '& .MuiAlert-icon': {
                    color: palette.info,
                  },
                }}
              >
                No files uploaded yet. You can skip this step if no documents are required.
              </Alert>
            )}
          </Box>
        )

      case 3:
        return (
          <Box>
            <Alert 
              severity="success" 
              icon={<CheckCircleIcon />} 
              sx={{ 
                mb: 3,
                bgcolor: `${palette.success}15`,
                border: `1px solid ${palette.success}`,
                '& .MuiAlert-icon': {
                  color: palette.success,
                },
              }}
            >
              Please review your request details before submitting.
            </Alert>

            <Grid container spacing={3}>
              {/* Request Type */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 3, border: `1px solid ${palette.borderLight}` }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Request Type
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {requestTypes.find((t) => t.value === formik.values.requestType)?.label}
                  </Typography>
                  <Chip
                    label={`Priority: ${formik.values.priority.toUpperCase()}`}
                    size="small"
                    sx={{ mt: 1, bgcolor: `${palette.primary}20`, color: palette.primary, fontWeight: 600 }}
                  />
                </Paper>
              </Grid>

              {/* Title & Description */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 3, border: `1px solid ${palette.borderLight}` }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Title
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    {formik.values.title}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {formik.values.description}
                  </Typography>

                  {formik.values.additionalInfo && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                        Additional Information
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {formik.values.additionalInfo}
                      </Typography>
                    </>
                  )}
                </Paper>
              </Grid>

              {/* Documents */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 3, border: `1px solid ${palette.borderLight}` }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Attached Documents ({uploadedFiles.length})
                  </Typography>
                  {uploadedFiles.length > 0 ? (
                    <List>
                      {uploadedFiles.map((file) => (
                        <ListItem key={file.id} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <DescriptionIcon sx={{ color: palette.primary }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={file.name}
                            secondary={formatFileSize(file.size)}
                          />
                          <Box sx={{ ml: 2 }}>
                            {getOcrStatusChip(file)}
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No documents attached
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/requests')}
          sx={{ mb: 2, color: palette.primary, fontWeight: 600 }}
        >
          Back to Requests
        </Button>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: palette.textPrimary }}>
          Create New Request
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Fill out the form below to submit your request
        </Typography>
      </Box>

      {/* Progress Stepper */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: `1px solid ${palette.borderLight}` }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel
                StepIconProps={{
                  sx: {
                    '&.Mui-active': {
                      color: palette.primary,
                    },
                    '&.Mui-completed': {
                      color: palette.primary,
                    },
                  },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <LinearProgress
          variant="determinate"
          value={(activeStep / (steps.length - 1)) * 100}
          sx={{
            mt: 3,
            height: 6,
            borderRadius: 3,
            bgcolor: `${palette.primary}15`,
            '& .MuiLinearProgress-bar': {
              bgcolor: palette.primary,
            },
          }}
        />
      </Paper>

      {/* Form Content */}
      <Paper elevation={0} sx={{ p: 4, mb: 3, border: `1px solid ${palette.borderLight}` }}>
        <form onSubmit={formik.handleSubmit}>
          {renderStepContent()}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
              sx={{ color: palette.oliveGreen }}
            >
              Back
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" onClick={() => navigate('/requests')}>
                Cancel
              </Button>

              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{
                    bgcolor: palette.primary,
                    color: palette.white,
                    minWidth: 150,
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    bgcolor: palette.primary,
                    color: palette.white,
                  }}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  )
}
