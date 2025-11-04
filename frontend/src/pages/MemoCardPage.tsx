import { useState, useEffect } from 'react'
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material'
import {
  ContactMail as MemoIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
  CalendarMonth as CalendarIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
} from '@mui/icons-material'
import { useAuthStore } from '../stores/authStore'
import {
  getMemoCards,
  createMemoCard,
  downloadMemoDocument,
  MemoCard,
} from '../services/memoCardApi'

export default function MemoCardPage() {
  const [memos, setMemos] = useState<MemoCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [semester, setSemester] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [document, setDocument] = useState<File | null>(null)
  const { user } = useAuthStore()
  const userId = (user?.id ?? '').toString()

  useEffect(() => { fetchMemos() }, [])

  const fetchMemos = async () => {
    setLoading(true)
    try {
      if (!userId) throw new Error('Not logged in')
      const data = await getMemoCards(userId)
      setMemos(data)
      setError('')
    } catch (err) {
      setError('Unable to load memos')
    }
    setLoading(false)
  }

  const createMemo = async () => {
    if (!semester || !academicYear) return setError('Fill all fields')
    setLoading(true)
    try {
      if (!userId) throw new Error('Not logged in')
      await createMemoCard({
        user_id: userId,
        semester,
        academic_year: academicYear,
        document: document ?? undefined,
      })
      
      setShowDialog(false)
      setSemester('')
      setAcademicYear('')
      setDocument(null)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      fetchMemos()
      setError('')
    } catch (err) {
      setError('Failed to create memo')
    }
    setLoading(false)
  }

  const downloadMemo = async (id: string) => {
    try {
      const blob = await downloadMemoDocument(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `memo_card_${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Download failed')
    }
  }

  const handlePrint = (memo: MemoCard) => {
    // Open print dialog
    window.print()
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return '#2e7d32'
      case 'submitted': return '#ed6c02'
      case 'rejected': return '#d32f2f'
      case 'expired': return '#757575'
      default: return '#757575'
    }
  }

  const getStatusBgColor = (status?: string) => {
    switch (status) {
      case 'active': return '#e8f5e9'
      case 'submitted': return '#fff4e5'
      case 'rejected': return '#ffebee'
      case 'expired': return '#f5f5f5'
      default: return '#f5f5f5'
    }
  }

  // Get the most recent memo as current
  const currentMemoCard = memos.length > 0 ? memos[0] : null
  const memoId = currentMemoCard ? ((currentMemoCard as any).id || (currentMemoCard as any)._id || '') : ''

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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Memo card request submitted! Your new memo card will be available within 2 working days.
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress sx={{ color: '#95A37F' }} />
        </Box>
      )}

      {!loading && currentMemoCard && (
        <Grid container spacing={3}>
          {/* Current Memo Card */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3, borderRadius: 2, border: '2px solid #95A37F', bgcolor: '#f9faf7' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <MemoIcon sx={{ fontSize: 48, color: '#95A37F' }} />
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#636b2f' }}>
                      Current Memo Card
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Card ID: {memoId || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  icon={<CheckCircleIcon sx={{ fontSize: 18 }} />}
                  label={(currentMemoCard.status || 'active').toUpperCase()}
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

              {(currentMemoCard as any).admin_comments && (
                <Alert 
                  severity={currentMemoCard.status === 'rejected' ? 'error' : 'info'} 
                  sx={{ mb: 3 }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Admin Feedback:
                  </Typography>
                  <Typography variant="body2">
                    {(currentMemoCard as any).admin_comments}
                  </Typography>
                </Alert>
              )}

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
                    {currentMemoCard.academic_year}
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

                {currentMemoCard.issue_date && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CalendarIcon sx={{ color: '#95A37F', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Issue Date
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary" sx={{ pl: 4 }}>
                      {new Date(currentMemoCard.issue_date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}

                {currentMemoCard.expiry_date && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CalendarIcon sx={{ color: '#95A37F', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Valid Until
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary" sx={{ pl: 4 }}>
                      {new Date(currentMemoCard.expiry_date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => memoId && downloadMemo(memoId)}
                  disabled={!memoId}
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
                  onClick={() => handlePrint(currentMemoCard)}
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
                onClick={() => setShowDialog(true)}
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
      )}

      {!loading && !currentMemoCard && (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <MemoIcon sx={{ fontSize: 64, color: '#95A37F', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            No Memo Card Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            You don't have any memo cards yet. Request one to get started.
          </Typography>
          <Button
            variant="contained"
            onClick={() => setShowDialog(true)}
            sx={{
              bgcolor: '#95A37F',
              color: 'white',
              fontWeight: 600,
              px: 4,
              '&:hover': { bgcolor: '#7a8566' },
            }}
          >
            Request New Memo Card
          </Button>
        </Paper>
      )}

      {/* Request Dialog */}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: '#636b2f' }}>
          New Memo Card Request
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Semester"
            placeholder="e.g., 4th Semester"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Academic Year"
            placeholder="e.g., 2024-2025"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button 
            variant="outlined" 
            component="label" 
            fullWidth
            sx={{
              borderColor: '#95A37F',
              color: '#95A37F',
              '&:hover': { borderColor: '#95A37F', bgcolor: '#e8f0e0' },
            }}
          >
            {document ? document.name : 'Upload Document (Optional)'}
            <input
              type="file"
              hidden
              onChange={(e) => setDocument(e.target.files?.[0] || null)}
            />
          </Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setShowDialog(false)}
            sx={{ color: '#757575' }}
          >
            Cancel
          </Button>
          <Button
            onClick={createMemo}
            disabled={loading}
            variant="contained"
            sx={{
              bgcolor: '#95A37F',
              '&:hover': { bgcolor: '#7a8566' },
              minWidth: 100,
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
