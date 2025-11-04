import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  QrCode as QrCodeIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { getAllBusPasses, reviewBusPass, downloadBusPassQRCode, type BusPass } from '../services/busPassApi';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminBusPassReviewPage() {
  const [tabValue, setTabValue] = useState(0);
  const [passes, setPasses] = useState<BusPass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Review dialog state
  const [reviewDialog, setReviewDialog] = useState(false);
  const [selectedPass, setSelectedPass] = useState<BusPass | null>(null);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected' | null>(null);
  const [adminComments, setAdminComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const statusMap = ['all', 'pending', 'active', 'rejected', 'expired'];
  const currentStatus = statusMap[tabValue];

  useEffect(() => {
    fetchPasses();
  }, [tabValue]);

  const fetchPasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = currentStatus === 'all' ? undefined : currentStatus;
      const data = await getAllBusPasses(status);
      setPasses(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch bus passes');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (pass: BusPass, action: 'approved' | 'rejected') => {
    setSelectedPass(pass);
    setReviewAction(action);
    setAdminComments('');
    setReviewDialog(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedPass || !reviewAction) return;

    setSubmitting(true);
    setError(null);
    try {
      await reviewBusPass(selectedPass.id, reviewAction, adminComments || undefined);
      setSuccess(`Bus pass ${reviewAction === 'approved' ? 'approved' : 'rejected'} successfully!`);
      setReviewDialog(false);
      fetchPasses();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to review bus pass');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadQR = async (pass: BusPass) => {
    try {
      const blob = await downloadBusPassQRCode(pass.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pass.pass_id}_qr.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to download QR code');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'active':
        return 'success';
      case 'rejected':
        return 'error';
      case 'expired':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Bus Pass Review
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Review and manage student bus pass applications
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="All" />
          <Tab label="Pending" />
          <Tab label="Active" />
          <Tab label="Rejected" />
          <Tab label="Expired" />
        </Tabs>

        <TabPanel value={tabValue} index={tabValue}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : passes.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No {currentStatus !== 'all' ? currentStatus : ''} bus passes found
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Pass ID</strong></TableCell>
                    <TableCell><strong>User ID</strong></TableCell>
                    <TableCell><strong>Route</strong></TableCell>
                    <TableCell><strong>Boarding Point</strong></TableCell>
                    <TableCell><strong>Valid From</strong></TableCell>
                    <TableCell><strong>Valid To</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Applied On</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {passes.map((pass) => (
                    <TableRow key={pass.id} hover>
                      <TableCell>{pass.pass_id}</TableCell>
                      <TableCell>{pass.user_id}</TableCell>
                      <TableCell>{pass.route}</TableCell>
                      <TableCell>{pass.boarding_point}</TableCell>
                      <TableCell>{pass.valid_from ? formatDate(pass.valid_from) : '-'}</TableCell>
                      <TableCell>{pass.valid_to ? formatDate(pass.valid_to) : '-'}</TableCell>
                      <TableCell>
                        <Chip label={pass.status} color={getStatusColor(pass.status)} size="small" />
                      </TableCell>
                      <TableCell>{formatDate(pass.created_at)}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          {pass.status === 'pending' && (
                            <>
                              <IconButton
                                size="small"
                                color="success"
                                title="Approve"
                                onClick={() => handleReviewClick(pass, 'approved')}
                              >
                                <ApproveIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                title="Reject"
                                onClick={() => handleReviewClick(pass, 'rejected')}
                              >
                                <RejectIcon />
                              </IconButton>
                            </>
                          )}
                          {pass.status === 'active' && pass.qr_code_path && (
                            <IconButton
                              size="small"
                              color="primary"
                              title="Download QR Code"
                              onClick={() => handleDownloadQR(pass)}
                            >
                              <DownloadIcon />
                            </IconButton>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onClose={() => !submitting && setReviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {reviewAction === 'approved' ? 'Approve Bus Pass' : 'Reject Bus Pass'}
        </DialogTitle>
        <DialogContent>
          {selectedPass && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Pass ID:</strong> {selectedPass.pass_id}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>User ID:</strong> {selectedPass.user_id}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Route:</strong> {selectedPass.route}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Boarding Point:</strong> {selectedPass.boarding_point}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Admin Comments (Optional)"
            value={adminComments}
            onChange={(e) => setAdminComments(e.target.value)}
            placeholder={reviewAction === 'approved' ? 'Add any notes for approval...' : 'Provide reason for rejection...'}
          />
          {reviewAction === 'approved' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Approving this pass will generate a QR code and set 30-day validity period.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleReviewSubmit}
            variant="contained"
            color={reviewAction === 'approved' ? 'success' : 'error'}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : reviewAction === 'approved' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
