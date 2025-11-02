import { useState } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material'
import {
  Add as AddIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  EmojiEvents as AwardIcon,
} from '@mui/icons-material'

interface Certificate {
  id: string
  type: string
  status: 'pending' | 'approved' | 'rejected' | 'processing'
  requestDate: string
  deliveryDate?: string
}

const certificateTypes = [
  { value: 'bonafide', label: 'Bonafide Certificate', icon: <SchoolIcon /> },
  { value: 'conduct', label: 'Conduct Certificate', icon: <CheckCircleIcon /> },
  { value: 'completion', label: 'Course Completion Certificate', icon: <AwardIcon /> },
  { value: 'internship', label: 'Internship Certificate', icon: <WorkIcon /> },
  { value: 'transfer', label: 'Transfer Certificate', icon: <DescriptionIcon /> },
]

export default function CertificateRequestsPage() {
  const [selectedType, setSelectedType] = useState('')
  const [purpose, setPurpose] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const [mockRequests] = useState<Certificate[]>([
    {
      id: 'CERT-2024-001',
      type: 'Bonafide Certificate',
      status: 'approved',
      requestDate: '2024-10-15',
      deliveryDate: '2024-10-18',
    },
    {
      id: 'CERT-2024-002',
      type: 'Conduct Certificate',
      status: 'processing',
      requestDate: '2024-10-28',
    },
  ])

  const handleSubmit = () => {
    if (selectedType && purpose) {
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setSelectedType('')
        setPurpose('')
      }, 3000)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#2e7d32'
      case 'processing':
        return '#0288d1'
      case 'pending':
        return '#ed6c02'
      case 'rejected':
        return '#d32f2f'
      default:
        return '#757575'
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#e8f5e9'
      case 'processing':
        return '#e3f2fd'
      case 'pending':
        return '#fff3e0'
      case 'rejected':
        return '#ffebee'
      default:
        return '#f5f5f5'
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#95A37F', mb: 1 }}>
          Certificate Requests
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Request and track your academic certificates
        </Typography>
      </Box>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Certificate request submitted successfully! You will be notified once it's processed.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Request New Certificate */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, border: '2px solid #95A37F' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <AddIcon sx={{ fontSize: 32, color: '#95A37F', mr: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#95A37F' }}>
                Request New Certificate
              </Typography>
            </Box>

            <FormControl 
              fullWidth 
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                  borderColor: '#95A37F',
                  borderWidth: '2px',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#95A37F',
                },
              }}
            >
              <InputLabel>Certificate Type</InputLabel>
              <Select
                value={selectedType}
                label="Certificate Type"
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {certificateTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {type.icon}
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Purpose / Reason"
              multiline
              rows={4}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Please specify the purpose for requesting this certificate..."
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                  borderColor: '#95A37F',
                  borderWidth: '2px',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#95A37F',
                },
              }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmit}
              disabled={!selectedType || !purpose}
              sx={{
                bgcolor: '#95A37F',
                color: 'white',
                py: 1.5,
                fontWeight: 600,
                fontSize: '1rem',
                '&:hover': { bgcolor: '#7a8566' },
                '&:focus': { outline: '2px solid #95A37F', outlineOffset: 2 },
                '&:disabled': {
                  bgcolor: '#e0e0e0',
                  color: '#9e9e9e',
                },
              }}
            >
              Submit Request
            </Button>
          </Paper>
        </Grid>

        {/* Quick Info & Guidelines */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#636b2f', mb: 2 }}>
              Important Information
            </Typography>

            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon sx={{ color: '#95A37F' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Processing Time"
                  secondary="Certificates are usually processed within 3-5 working days"
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon sx={{ color: '#95A37F' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Collection"
                  secondary="Collect your certificate from the Student Services office"
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon sx={{ color: '#95A37F' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Valid Documents"
                  secondary="Keep your student ID card ready for verification"
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon sx={{ color: '#95A37F' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Track Status"
                  secondary="Check your request status in the list below"
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* My Certificate Requests */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#636b2f', mb: 3 }}>
              My Certificate Requests
            </Typography>

            <Grid container spacing={2}>
              {mockRequests.map((cert) => (
                <Grid item xs={12} md={6} key={cert.id}>
                  <Card sx={{ border: '1px solid #E0E0E0', borderRadius: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {cert.type}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Request ID: {cert.id}
                          </Typography>
                        </Box>
                        <Chip
                          label={cert.status.toUpperCase()}
                          size="small"
                          sx={{
                            bgcolor: getStatusBgColor(cert.status),
                            color: getStatusColor(cert.status),
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            border: `1.5px solid ${getStatusColor(cert.status)}`,
                          }}
                        />
                      </Box>

                      <Divider sx={{ my: 1.5 }} />

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Requested:</strong> {new Date(cert.requestDate).toLocaleDateString()}
                        </Typography>
                        {cert.deliveryDate && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Ready by:</strong> {new Date(cert.deliveryDate).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>

                      {cert.status === 'approved' && (
                        <Button
                          fullWidth
                          variant="outlined"
                          sx={{
                            mt: 2,
                            borderColor: '#95A37F',
                            color: '#95A37F',
                            borderWidth: 2,
                            fontWeight: 600,
                            '&:hover': {
                              borderColor: '#95A37F',
                              bgcolor: '#e8f0e0',
                              borderWidth: 2,
                            },
                            '&:focus': { outline: '2px solid #95A37F', outlineOffset: 2 },
                          }}
                        >
                          View Details
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {mockRequests.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No certificate requests found. Create your first request above!
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
