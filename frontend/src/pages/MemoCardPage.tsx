import { useState, useEffect } from 'react'
import {
  Container, Typography, Button, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Alert
} from '@mui/material'
import { Add as AddIcon, Download as DownloadIcon } from '@mui/icons-material'
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
      a.download = 'memo.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Download failed')
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 2, color: '#636b2f' }}>
        Memo Card Portal
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error} <Button size="small" onClick={fetchMemos}>Retry</Button>
        </Alert>
      )}

      {loading && <CircularProgress sx={{ mb: 2, color: '#95A37F' }} />}

      {memos.map((memo) => {
        const memoId = (memo as any).id || (memo as any)._id || ''
        return (
        <Paper key={memoId || Math.random()} sx={{ p: 2, mb: 2 }}>
          <Typography>Semester: {memo.semester}</Typography>
          <Typography>Academic Year: {memo.academic_year}</Typography>
          {memo.status && (
            <Typography>Status: {memo.status}</Typography>
          )}
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => memoId && downloadMemo(memoId)}
            disabled={!memoId}
            sx={{ mt: 1, bgcolor: '#95A37F', color: 'white' }}
          >
            Download
          </Button>
        </Paper>)
      })}

      {!loading && memos.length === 0 && (
        <Typography sx={{ mb: 2 }}>No memos found</Typography>
      )}

      <Button
        startIcon={<AddIcon />}
        variant="contained"
        onClick={() => setShowDialog(true)}
        sx={{ bgcolor: '#95A37F' }}
      >
        Request New Memo
      </Button>

      <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
        <DialogTitle>New Memo Request</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Semester"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Academic Year"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="outlined" component="label" fullWidth>
            {document ? document.name : 'Upload Document (Optional)'}
            <input
              type="file"
              hidden
              onChange={(e) => setDocument(e.target.files?.[0] || null)}
            />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>Cancel</Button>
          <Button
            onClick={createMemo}
            disabled={loading}
            variant="contained"
            sx={{ bgcolor: '#95A37F' }}
          >
            {loading ? <CircularProgress size={20} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
