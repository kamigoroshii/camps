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
  Tooltip
} from '@mui/material';
import {
  Visibility,
  CheckCircle,
  Cancel,
  Description,
  Download,
  Assessment
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  const fetchVerificationDetails = async (requestId: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/scholarship-verification/verification-report/${requestId}`);
      setVerificationDetails(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch verification details');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = async (request: PendingRequest) => {
    setSelectedRequest(request);
    await fetchVerificationDetails(request.request_id);
    setOpenReviewDialog(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedRequest) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('action', reviewAction);
      formData.append('comments', reviewComments);

      await api.post(
        `/scholarship-verification/manual-review/${selectedRequest.request_id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Refresh list
      await fetchPendingRequests();
      setOpenReviewDialog(false);
      setSelectedRequest(null);
      setReviewComments('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'default';
    }
  };

  const renderVerificationSummary = () => {
    if (!verificationDetails) return null;

    const { verification_results, confidence } = verificationDetails;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Verification Summary
        </Typography>

        <Alert
          severity={confidence > 0.8 ? 'success' : confidence > 0.6 ? 'warning' : 'error'}
          sx={{ mb: 2 }}
        >
          Overall Confidence Score: {(confidence * 100).toFixed(0)}%
        </Alert>

        <Grid container spacing={2}>
          {Object.entries(verification_results || {}).map(([key, value]: [string, any]) => (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" textTransform="capitalize" gutterBottom>
                    {key.replace('_', ' ')}
                  </Typography>
                  <Chip
                    label={value.status}
                    size="small"
                    color={
                      ['verified', 'valid', 'complete', 'passed'].includes(value.status)
                        ? 'success'
                        : ['review_required', 'review_recommended'].includes(value.status)
                        ? 'warning'
                        : 'error'
                    }
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Confidence: {(value.confidence * 100).toFixed(0)}%
                  </Typography>

                  {value.issues && value.issues.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="error">
                        Issues:
                      </Typography>
                      {value.issues.slice(0, 2).map((issue: string, idx: number) => (
                        <Typography key={idx} variant="caption" display="block" color="error">
                          • {issue}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  const renderDocumentAnalyses = () => {
    if (!verificationDetails?.document_analyses) return null;

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Document Analyses
        </Typography>

        {verificationDetails.document_analyses.map((doc: any, index: number) => (
          <Accordion key={index}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>{doc.document_name}</Typography>
              {doc.extracted_data && (
                <Chip
                  label={`OCR: ${(doc.extracted_data.confidence * 100).toFixed(0)}%`}
                  size="small"
                  sx={{ ml: 2 }}
                />
              )}
            </AccordionSummary>
            <AccordionDetails>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                <Tab label="Extracted Data" />
                <Tab label="Identity Check" />
                <Tab label="Authenticity Check" />
              </Tabs>

              {tabValue === 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Structured Data:
                  </Typography>
                  <pre style={{ fontSize: '0.85rem', overflow: 'auto', maxHeight: 300 }}>
                    {JSON.stringify(doc.extracted_data?.structured_data, null, 2)}
                  </pre>
                </Box>
              )}

              {tabValue === 1 && doc.identity && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity={doc.identity.status === 'verified' ? 'success' : 'warning'}>
                    Status: {doc.identity.status} (Confidence:{' '}
                    {(doc.identity.confidence * 100).toFixed(0)}%)
                  </Alert>

                  {doc.identity.matches && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">Matches:</Typography>
                      <List dense>
                        {Object.entries(doc.identity.matches).map(([key, value]: [string, any]) => (
                          <ListItem key={key}>
                            <ListItemText
                              primary={key}
                              secondary={`Doc: ${value.document} | DB: ${value.database}`}
                            />
                            <Chip
                              label={`${(value.confidence * 100).toFixed(0)}%`}
                              size="small"
                              color="success"
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {doc.identity.mismatches && Object.keys(doc.identity.mismatches).length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">Mismatches:</Typography>
                      <List dense>
                        {Object.entries(doc.identity.mismatches).map(([key, value]: [string, any]) => (
                          <ListItem key={key}>
                            <ListItemText
                              primary={key}
                              secondary={`Doc: ${value.document} | DB: ${value.database}`}
                            />
                            <Chip
                              label={`${(value.confidence * 100).toFixed(0)}%`}
                              size="small"
                              color="error"
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
              )}

              {tabValue === 2 && doc.authenticity && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity={doc.authenticity.status === 'verified' ? 'success' : 'warning'}>
                    Status: {doc.authenticity.status} (Confidence:{' '}
                    {(doc.authenticity.confidence * 100).toFixed(0)}%)
                  </Alert>

                  {doc.authenticity.checks && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">Authenticity Checks:</Typography>
                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        {Object.entries(doc.authenticity.checks).map(([key, value]: [string, any]) => (
                          <Grid item xs={6} key={key}>
                            <Typography variant="caption" display="block">
                              {key}: {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                            </Typography>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {doc.authenticity.issues && doc.authenticity.issues.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="error">
                        Issues:
                      </Typography>
                      {doc.authenticity.issues.map((issue: string, idx: number) => (
                        <Typography key={idx} variant="body2" color="error">
                          • {issue}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Scholarship Applications Review
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Review and approve/reject scholarship applications flagged for manual verification
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Request #</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Student ID</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>SLA Due</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pendingRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No pending requests
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              pendingRequests.map((request) => (
                <TableRow key={request.request_id} hover>
                  <TableCell>{request.request_number}</TableCell>
                  <TableCell>{request.title}</TableCell>
                  <TableCell>{request.user_id}</TableCell>
                  <TableCell>
                    <Chip
                      label={request.priority}
                      size="small"
                      color={getPriorityColor(request.priority)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={request.status} size="small" color="warning" />
                  </TableCell>
                  <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {request.sla_due_date
                      ? new Date(request.sla_due_date).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleViewRequest(request)}
                      size="small"
                    >
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Review Dialog */}
      <Dialog open={openReviewDialog} onClose={() => setOpenReviewDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              Review Request: {selectedRequest?.request_number}
            </Typography>
            <Chip
              label={selectedRequest?.priority}
              size="small"
              color={selectedRequest ? getPriorityColor(selectedRequest.priority) : 'default'}
            />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {renderVerificationSummary()}
          {renderDocumentAnalyses()}

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Manual Review Decision
          </Typography>

          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <FormLabel component="legend">Action</FormLabel>
            <RadioGroup
              value={reviewAction}
              onChange={(e) => setReviewAction(e.target.value as 'approve' | 'reject')}
            >
              <FormControlRadio
                value="approve"
                control={<Radio />}
                label={
                  <Box display="flex" alignItems="center">
                    <CheckCircle color="success" sx={{ mr: 1 }} />
                    Approve Application
                  </Box>
                }
              />
              <FormControlRadio
                value="reject"
                control={<Radio />}
                label={
                  <Box display="flex" alignItems="center">
                    <Cancel color="error" sx={{ mr: 1 }} />
                    Reject Application
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>

          <TextField
            label="Comments (Required)"
            multiline
            rows={4}
            fullWidth
            value={reviewComments}
            onChange={(e) => setReviewComments(e.target.value)}
            sx={{ mt: 3 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReviewDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitReview}
            disabled={!reviewComments.trim() || loading}
            color={reviewAction === 'approve' ? 'success' : 'error'}
          >
            {loading ? 'Submitting...' : `${reviewAction === 'approve' ? 'Approve' : 'Reject'}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminScholarshipReviewPage;
