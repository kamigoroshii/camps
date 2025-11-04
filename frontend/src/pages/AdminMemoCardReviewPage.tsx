import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  ContactMail as MemoIcon,
} from '@mui/icons-material'
import { getAllMemoCards, reviewMemoCard, downloadMemoDocument, MemoCard } from '../services/memoCardApi'

export default function AdminMemoCardReviewPage() {
  const [memos, setMemos] = useState<MemoCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedTab, setSelectedTab] = useState(0)
  const [reviewDialog, setReviewDialog] = useState(false)
  const [selectedMemo, setSelectedMemo] = useState<MemoCard | null>(null)
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved')
  const [adminComments, setAdminComments] = useState('')

  const statusFilters = ['all', 'submitted', 'active', 'rejected', 'expired']

  useEffect(() => {
    fetchMemos()
  }, [selectedTab])

  const fetchMemos = async () => {
    setLoading(true)
    try {
      const filter = statusFilters[selectedTab] === 'all' ? undefined : statusFilters[selectedTab]
      const data = await getAllMemoCards(filter)
      setMemos(data)
      setError('')
    } catch (err) {
      setError('Failed to load memo cards')
    }
    setLoading(false)
  }

  const handleReview = async () => {
    if (!selectedMemo) return
    
    setLoading(true)
    try {
      const memoId = (selectedMemo as any).id || (selectedMemo as any)._id || ''
      await reviewMemoCard(memoId, reviewStatus, adminComments)
      setSuccess(`Memo card ${reviewStatus}!`)
      setTimeout(() => setSuccess(''), 3000)
      setReviewDialog(false)
      setAdminComments('')
      fetchMemos()
    } catch (err) {
      setError('Failed to review memo card')
    }
    setLoading(false)
  }

  const handleDownload = async (memo: MemoCard) => {
    try {
      const memoId = (memo as any).id || (memo as any)._id || ''
      const blob = await downloadMemoDocument(memoId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `memo_${memo.memo_id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Download failed')
    }
  }

  const openReviewDialog = (memo: MemoCard, status: 'approved' | 'rejected') => {
    setSelectedMemo(memo)
    setReviewStatus(status)
    setReviewDialog(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'warning'
      case 'active': return 'success'
      case 'rejected': return 'error'
      case 'expired': return 'default'
      default: return 'default'
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0891b2', mb: 1 }}>
          Memo Card Review Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and manage student memo card requests
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs 
          value={selectedTab} 
          onChange={(_, val) => setSelectedTab(val)}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            bgcolor: '#f5f5f5',
          }}
        >
          <Tab label="All Requests" />
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
          <Tab label="Expired" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#0891b2' }} />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f9fafb' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Memo ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>User ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Semester</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Academic Year</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Request Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {memos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <MemoIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        No memo card requests found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  memos.map((memo) => (
                    <TableRow 
                      key={(memo as any).id || (memo as any)._id}
                      hover
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0891b2' }}>
                          {memo.memo_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {memo.user_id.substring(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>{memo.semester}</TableCell>
                      <TableCell>{memo.academic_year}</TableCell>
                      <TableCell>
                        {new Date(memo.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={memo.status.toUpperCase()} 
                          color={getStatusColor(memo.status)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          {memo.document_path && (
                            <Tooltip title="Download Document">
                              <IconButton 
                                size="small" 
                                onClick={() => handleDownload(memo)}
                                sx={{ color: '#0891b2' }}
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {memo.status === 'submitted' && (
                            <>
                              <Tooltip title="Approve">
                                <IconButton 
                                  size="small" 
                                  onClick={() => openReviewDialog(memo, 'approved')}
                                  sx={{ color: '#2e7d32' }}
                                >
                                  <ApproveIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton 
                                  size="small" 
                                  onClick={() => openReviewDialog(memo, 'rejected')}
                                  sx={{ color: '#d32f2f' }}
                                >
                                  <RejectIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onClose={() => setReviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: reviewStatus === 'approved' ? '#2e7d32' : '#d32f2f' }}>
          {reviewStatus === 'approved' ? 'Approve' : 'Reject'} Memo Card Request
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedMemo && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Memo ID:</strong> {selectedMemo.memo_id}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Semester:</strong> {selectedMemo.semester}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Academic Year:</strong> {selectedMemo.academic_year}
              </Typography>
            </Box>
          )}
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Admin Comments (Optional)"
            placeholder="Enter any comments or feedback for the student..."
            value={adminComments}
            onChange={(e) => setAdminComments(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReviewDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleReview}
            disabled={loading}
            variant="contained"
            sx={{
              bgcolor: reviewStatus === 'approved' ? '#2e7d32' : '#d32f2f',
              '&:hover': { 
                bgcolor: reviewStatus === 'approved' ? '#1b5e20' : '#c62828' 
              },
              minWidth: 120,
            }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              `${reviewStatus === 'approved' ? 'Approve' : 'Reject'} Request`
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
