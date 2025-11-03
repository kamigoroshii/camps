/**
 * Admin Scholarship Review Page
 * For reviewing scholarship applications with OCR verification results
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Tooltip,
  IconButton,
  TableRow as MuiTableRow
} from '@mui/material';
import {
  Visibility,
  CheckCircle,
  Cancel,
  Description,
  Download,
  Assessment,
  Refresh
} from '@mui/icons-material';
import api from '../services/api';

interface Application {
  request_id: string;
  application_number: string;
  status: string;
  submitted_date: string;
  data: {
    full_name: string;
    email: string;
    phone: string;
    course: string;
    year_of_study: string;
    reason: string;
  };
  documents_count?: number;
}

interface Document {
  id: string;
  type: string;
  filename: string;
  is_verified: boolean;
  ocr_text?: string;
  uploaded_at: string;
}

interface VerificationDetails {
  success: boolean;
  request_id: string;
  application_number: string;
  overall_score: number | null;
  status: string;
  documents: Document[];
  verification_results: any;
}

const AdminScholarshipReviewPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [verificationDetails, setVerificationDetails] = useState<VerificationDetails | null>(null);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<string>('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/scholarship-verification/admin/pending');
      setApplications(response.data.applications || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchVerificationDetails = async (requestId: string) => {
    setLoadingDetails(true);
    try {
      const response = await api.get(`/scholarship-verification/verification-details/${requestId}`);
      setVerificationDetails(response.data);
    } catch (err: any) {
      setError('Failed to fetch verification details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = async (app: Application) => {
    setSelectedApp(app);
    setOpenDetailsDialog(true);
    await fetchVerificationDetails(app.request_id);
  };

  const handleOpenReview = (app: Application) => {
    setSelectedApp(app);
    setOpenReviewDialog(true);
    setReviewAction('approved');
    setReviewNotes('');
  };

  const handleSubmitReview = async () => {
    if (!selectedApp) return;

    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('status', reviewAction);
      if (reviewNotes) {
        formData.append('notes', reviewNotes);
      }

      await api.post(
        `/scholarship-verification/admin/review/${selectedApp.request_id}`,
        formData
      );

      setSuccess(`Application ${selectedApp.application_number} ${reviewAction} successfully`);
      setOpenReviewDialog(false);
      setSelectedApp(null);
      setReviewNotes('');
      
      // Refresh the list
      await fetchApplications();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDocument = async (documentId: string) => {
    try {
      const response = await api.get(`/scholarship-verification/document/${documentId}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (err) {
      setError('Failed to view document');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'UNDER_REVIEW':
        return 'warning';
      case 'SUBMITTED':
        return 'info';
      default:
        return 'default';
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'default';
    if (score >= 0.7) return 'success';
    if (score >= 0.5) return 'warning';
    return 'error';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Scholarship Application Review
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchApplications}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : applications.length === 0 ? (
          <Box textAlign="center" p={4}>
            <Typography color="text.secondary">
              No pending applications to review
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Application #</TableCell>
                  <TableCell>Applicant</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Documents</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.request_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {app.application_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{app.data.full_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {app.data.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{app.data.course}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Year {app.data.year_of_study}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={app.status}
                        size="small"
                        color={getStatusColor(app.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge badgeContent={app.documents_count || 0} color="primary">
                        <Description />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(app.submitted_date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(app)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Review">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenReview(app)}
                        >
                          <Assessment />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Application Details
          {selectedApp && ` - ${selectedApp.application_number}`}
        </DialogTitle>
        <DialogContent>
          {loadingDetails ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : verificationDetails && selectedApp ? (
            <Box>
              {/* Applicant Information */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Applicant Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Full Name
                      </Typography>
                      <Typography variant="body2">{selectedApp.data.full_name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body2">{selectedApp.data.email}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body2">{selectedApp.data.phone}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Course
                      </Typography>
                      <Typography variant="body2">{selectedApp.data.course}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Reason for Scholarship
                      </Typography>
                      <Typography variant="body2">{selectedApp.data.reason}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Verification Score */}
              {verificationDetails.overall_score !== null && (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Overall Verification Score
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box flex={1}>
                        <LinearProgress
                          variant="determinate"
                          value={(verificationDetails.overall_score || 0) * 100}
                          sx={{ height: 10, borderRadius: 1 }}
                          color={getScoreColor(verificationDetails.overall_score)}
                        />
                      </Box>
                      <Typography variant="h6">
                        {((verificationDetails.overall_score || 0) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Documents */}
              <Typography variant="h6" gutterBottom>
                Uploaded Documents ({verificationDetails.documents.length})
              </Typography>
              {verificationDetails.documents.map((doc, index) => (
                <Card key={index} sx={{ mb: 1 }} variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle2">{doc.type}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {doc.filename}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1} alignItems="center">
                        <Chip
                          label={doc.is_verified ? 'Verified' : 'Pending'}
                          size="small"
                          color={doc.is_verified ? 'success' : 'warning'}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleViewDocument(doc.id)}
                        >
                          <Visibility />
                        </IconButton>
                      </Box>
                    </Box>
                    {doc.ocr_text && (
                      <Box mt={1} p={1} bgcolor="grey.100" borderRadius={1}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          OCR Extract (preview):
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                          {doc.ocr_text.substring(0, 200)}...
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Typography>No details available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog
        open={openReviewDialog}
        onClose={() => !submitting && setOpenReviewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Review Application</DialogTitle>
        <DialogContent>
          {selectedApp && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Reviewing application: <strong>{selectedApp.application_number}</strong>
                <br />
                Applicant: <strong>{selectedApp.data.full_name}</strong>
              </Alert>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Decision</InputLabel>
                <Select
                  value={reviewAction}
                  label="Decision"
                  onChange={(e) => setReviewAction(e.target.value)}
                >
                  <MenuItem value="approved">Approve</MenuItem>
                  <MenuItem value="rejected">Reject</MenuItem>
                  <MenuItem value="pending_approval">Request More Information</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Review Notes (Optional)"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any comments or reasons for your decision..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReviewDialog(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
            color={reviewAction === 'approved' ? 'success' : reviewAction === 'rejected' ? 'error' : 'primary'}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminScholarshipReviewPage;
