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
  Alert,
  Chip,
  Divider,
} from '@mui/material'
import {
  ContactMail as MemoIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
  CalendarMonth as CalendarIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
} from '@mui/icons-material'

interface MemoCard {
  id: string
  semester: string
  academicYear: string
  issueDate: string
  expiryDate: string
  status: 'active' | 'expired'
}

export default function MemoCardPage() {
  const [showSuccess, setShowSuccess] = useState(false)

  const [currentMemoCard] = useState<MemoCard>({
    id: 'MC-2024-STU2024001',
    semester: '4th Semester',
    academicYear: '2024-2025',
    issueDate: '2024-11-01',
    expiryDate: '2025-04-30',
    status: 'active',
  })

  const handleRequestNew = () => {
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
    }, 3000)
  }

  const getStatusColor = (status: string) => {
    return status === 'active' ? '#2e7d32' : '#757575'
  }

  const getStatusBgColor = (status: string) => {
    return status === 'active' ? '#e8f5e9' : '#f5f5f5'
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#95A37F', mb: 1 }}>
          Memo Card Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and download your academic memo card
        </Typography>
      </Box>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Memo card request submitted! Your new memo card will be available within 2 working days.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Current Memo Card */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 2, border: '2px solid #95A37F', bgcolor: '#f9faf7' }}>
            <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'flex-start', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MemoIcon sx={{ fontSize: 48, color: '#95A37F' }} />
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#636b2f' }}>
                    Current Memo Card
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Card ID: {currentMemoCard.id}
                  </Typography>
                </Box>
              </Box>
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: 18 }} />}
                label={currentMemoCard.status.toUpperCase()}
                sx={{
                  bgcolor: getStatusBgColor(currentMemoCard.status),
                  color: getStatusColor(currentMemoCard.status),
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  border: `1.5px solid ${getStatusColor(currentMemoCard.status)}`,
                  '& .MuiChip-icon': {
                    color: getStatusColor(currentMemoCard.status),
                  },
                }}
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Memo Card Details */}
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SchoolIcon sx={{ color: '#95A37F', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Academic Year
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ pl: 4 }}>
                  {currentMemoCard.academicYear}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SchoolIcon sx={{ color: '#95A37F', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Semester
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ pl: 4 }}>
                  {currentMemoCard.semester}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CalendarIcon sx={{ color: '#95A37F', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Issue Date
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ pl: 4 }}>
                  {new Date(currentMemoCard.issueDate).toLocaleDateString()}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CalendarIcon sx={{ color: '#95A37F', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Valid Until
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ pl: 4 }}>
                  {new Date(currentMemoCard.expiryDate).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                sx={{
                  bgcolor: '#95A37F',
                  color: 'white',
                  fontWeight: 600,
                  px: 3,
                  '&:hover': { bgcolor: '#7a8566' },
                  '&:focus': { outline: '2px solid #95A37F', outlineOffset: 2 },
                }}
              >
                Download PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                sx={{
                  borderColor: '#95A37F',
                  color: '#95A37F',
                  fontWeight: 600,
                  borderWidth: 2,
                  px: 3,
                  '&:hover': {
                    borderColor: '#95A37F',
                    bgcolor: '#e8f0e0',
                    borderWidth: 2,
                  },
                  '&:focus': { outline: '2px solid #95A37F', outlineOffset: 2 },
                }}
              >
                Print Card
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Information & Actions */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#636b2f', mb: 2 }}>
              About Memo Card
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              The memo card contains important academic information including:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 1 }}>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Student identification details
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Current semester information
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Academic calendar
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Important college contacts
              </Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#636b2f', mb: 2 }}>
              Request New Card
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Need a replacement or new memo card? Request one here.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              onClick={handleRequestNew}
              sx={{
                bgcolor: '#95A37F',
                color: 'white',
                py: 1.5,
                fontWeight: 600,
                '&:hover': { bgcolor: '#7a8566' },
                '&:focus': { outline: '2px solid #95A37F', outlineOffset: 2 },
              }}
            >
              Request New Memo Card
            </Button>
            <Alert severity="info" sx={{ mt: 2 }}>
              Processing fee: ₹50 for replacement cards
            </Alert>
          </Paper>
        </Grid>

        {/* Usage Guidelines */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#636b2f', mb: 2 }}>
              Important Guidelines
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', border: '1px solid #E0E0E0' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Always Carry
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Keep your memo card with you at all times on campus for identification purposes.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', border: '1px solid #E0E0E0' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Lost or Damaged
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Report immediately to the Student Services office if your card is lost or damaged.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', border: '1px solid #E0E0E0' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Validity Period
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Memo card is valid for one semester. Renew at the beginning of each semester.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
