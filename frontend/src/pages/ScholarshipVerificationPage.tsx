/**
 * Scholarship Verification Page
 * Allows students to submit scholarship documents and track verification status
 * Provides admin interface for manual review of flagged applications
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Card,
  CardContent,
  CardActions,
  Chip,
  LinearProgress,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  OutlinedInput
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Warning,
  Error,
  Pending,
  Description,
  Visibility,
  ExpandMore,
  Assignment,
  VerifiedUser,
  Security,
  Assessment,
  ChecklistRtl
} from '@mui/icons-material';
import api from '../services/api';

interface VerificationResult {
  status: string;
  confidence: number;
  matches?: any;
  mismatches?: any;
  issues?: string[];
  warnings?: string[];
}

interface DocumentVerification {
  document_name: string;
  document_type: string;
  extraction: {
    method: string;
    confidence: number;
    text_length: number;
    structured_data: any;
  };
  verification: {
    identity: VerificationResult;
    authenticity: VerificationResult;
  };
}

interface ScholarshipRequest {
  request_id: number;
  request_number: string;
  status: string;
  confidence?: number;
  decision?: any;
  verification_results?: any;
  report?: any;
}

const ScholarshipVerificationPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [requestId, setRequestId] = useState<number | null>(null);
  const [requestIdInput, setRequestIdInput] = useState<string>('');
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentVerification[]>([]);
  const [verificationResults, setVerificationResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [showRequestIdForm, setShowRequestIdForm] = useState(true);

  // Check for request ID in URL params or localStorage on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlRequestId = urlParams.get('requestId');
    const storedRequestId = localStorage.getItem('scholarshipRequestId');
    
    if (urlRequestId) {
      setRequestId(parseInt(urlRequestId));
      setRequestIdInput(urlRequestId);
      setShowRequestIdForm(false);
    } else if (storedRequestId) {
      setRequestId(parseInt(storedRequestId));
      setRequestIdInput(storedRequestId);
      setShowRequestIdForm(false);
    }
  }, []);

  // Document upload steps
  const steps = [
    'Upload Required Documents',
    'Automated Verification',
    'Review Results',
    'Final Decision'
  ];

  // Required documents for scholarship
  const requiredDocuments = [
    { type: 'income_certificate', label: 'Income Certificate', uploaded: false },
    { type: 'grade_sheet', label: 'Grade Sheet / Mark Sheet', uploaded: false },
    { type: 'bank_details', label: 'Bank Account Details', uploaded: false },
    { type: 'id_proof', label: 'ID Proof (Aadhar/Student ID)', uploaded: false }
  ];

  const [documentStatus, setDocumentStatus] = useState(requiredDocuments);

  const handleRequestIdSubmit = () => {
    if (!requestIdInput.trim()) {
      setError('Please enter a valid request ID');
      return;
    }

    const parsedId = parseInt(requestIdInput.trim());
    if (isNaN(parsedId)) {
      setError('Request ID must be a number');
      return;
    }

    setRequestId(parsedId);
    localStorage.setItem('scholarshipRequestId', requestIdInput.trim());
    setShowRequestIdForm(false);
    setError(null);
  };

  const handleRequestIdReset = () => {
    setRequestId(null);
    setRequestIdInput('');
    setShowRequestIdForm(true);
    localStorage.removeItem('scholarshipRequestId');
    setActiveStep(0);
    setUploadedDocuments([]);
    setVerificationResults(null);
    setDocumentStatus(requiredDocuments.map(doc => ({ ...doc, uploaded: false })));
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!requestId) {
      setError('Request ID is required. Please enter your request ID first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);

      const response = await api.post(`/scholarship-verification/upload/${requestId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update document status
      setDocumentStatus(prev =>
        prev.map(doc =>
          doc.type === documentType ? { ...doc, uploaded: true } : doc
        )
      );

      // Store verification results
      setUploadedDocuments(prev => [...prev, response.data]);

      // Check if all documents uploaded
      const allUploaded = documentStatus.every(doc =>
        doc.type === documentType || doc.uploaded
      );

      if (allUploaded) {
        setActiveStep(1);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const runComprehensiveVerification = async () => {
    if (!requestId) {
      setError('Request ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post(`/scholarship-verification/verify-request/${requestId}`);
      setVerificationResults(response.data);
      setActiveStep(2);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const renderUploadStep = () => (
    <Box>
      {requestId && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2">
              Request ID: <strong>{requestId}</strong>
            </Typography>
            <Button size="small" onClick={handleRequestIdReset}>
              Change Request ID
            </Button>
          </Box>
        </Alert>
      )}

      <Typography variant="body1" gutterBottom>
        Please upload all required documents for scholarship verification:
      </Typography>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        {documentStatus.map((doc) => (
          <Grid item xs={12} md={6} key={doc.type}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center">
                    <Description sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">{doc.label}</Typography>
                  </Box>
                  {doc.uploaded && (
                    <CheckCircle color="success" />
                  )}
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  disabled={loading || doc.uploaded}
                  fullWidth
                >
                  {doc.uploaded ? 'Uploaded' : 'Upload'}
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(doc.type, file);
                    }}
                  />
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {uploadedDocuments.length > 0 && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Upload Results
          </Typography>
          {uploadedDocuments.map((doc, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>{doc.document_name}</Typography>
                <Chip
                  label={`OCR: ${(doc.extraction.confidence * 100).toFixed(0)}%`}
                  color={doc.extraction.confidence > 0.7 ? 'success' : 'warning'}
                  size="small"
                  sx={{ ml: 2 }}
                />
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Extracted Data:
                  </Typography>
                  <pre style={{ fontSize: '0.85rem', overflow: 'auto' }}>
                    {JSON.stringify(doc.extraction.structured_data, null, 2)}
                  </pre>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Identity Verification:
                  </Typography>
                  <Alert
                    severity={
                      doc.verification.identity.status === 'verified'
                        ? 'success'
                        : doc.verification.identity.status === 'review_required'
                        ? 'warning'
                        : 'error'
                    }
                  >
                    Status: {doc.verification.identity.status} (Confidence:{' '}
                    {(doc.verification.identity.confidence * 100).toFixed(0)}%)
                  </Alert>

                  {doc.verification.identity.issues && doc.verification.identity.issues.length > 0 && (
                    <List dense>
                      {doc.verification.identity.issues.map((issue: string, i: number) => (
                        <ListItem key={i}>
                          <ListItemIcon>
                            <Warning color="warning" />
                          </ListItemIcon>
                          <ListItemText primary={issue} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {documentStatus.every(doc => doc.uploaded) && (
        <Button
          variant="contained"
          onClick={() => setActiveStep(1)}
          sx={{ mt: 3 }}
          fullWidth
        >
          Proceed to Verification
        </Button>
      )}
    </Box>
  );

  const renderVerificationStep = () => (
    <Box>
      <Typography variant="body1" gutterBottom>
        Run comprehensive automated verification on all uploaded documents.
      </Typography>

      <Paper sx={{ p: 3, mt: 2, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Verification Checks
        </Typography>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <VerifiedUser fontSize="large" color="primary" />
              <Typography variant="subtitle2">Identity</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Security fontSize="large" color="primary" />
              <Typography variant="subtitle2">Authenticity</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Assessment fontSize="large" color="primary" />
              <Typography variant="subtitle2">Data Validity</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <ChecklistRtl fontSize="large" color="primary" />
              <Typography variant="subtitle2">Completeness</Typography>
            </Box>
          </Grid>
        </Grid>

        <Button
          variant="contained"
          color="primary"
          onClick={runComprehensiveVerification}
          disabled={loading}
          sx={{ mt: 4 }}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : 'Start Verification'}
        </Button>
      </Paper>

      {loading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" align="center" gutterBottom>
            Running automated verification checks...
          </Typography>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );

  const renderResultsStep = () => {
    if (!verificationResults) return null;

    const { decision, verification_results, confidence } = verificationResults;

    return (
      <Box>
        <Alert
          severity={
            decision.action === 'approve'
              ? 'success'
              : decision.action === 'reject'
              ? 'error'
              : 'warning'
          }
          sx={{ mb: 3 }}
        >
          <Typography variant="h6">
            {decision.action === 'approve' && 'Application Approved!'}
            {decision.action === 'reject' && 'Application Rejected'}
            {decision.action === 'review' && 'Manual Review Required'}
          </Typography>
          <Typography variant="body2">{decision.reason}</Typography>
        </Alert>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Verification Summary
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Overall Confidence Score
              </Typography>
              <Box display="flex" alignItems="center">
                <LinearProgress
                  variant="determinate"
                  value={confidence * 100}
                  sx={{ flexGrow: 1, mr: 2 }}
                />
                <Typography variant="body2">{(confidence * 100).toFixed(0)}%</Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              {Object.entries(verification_results).map(([key, value]: [string, any]) => (
                <Grid item xs={12} sm={6} key={key}>
                  <Box>
                    <Typography variant="subtitle2" textTransform="capitalize">
                      {key.replace('_', ' ')}
                    </Typography>
                    <Chip
                      label={value.status}
                      size="small"
                      color={
                        value.status === 'verified' || value.status === 'valid' || value.status === 'complete' || value.status === 'passed'
                          ? 'success'
                          : value.status === 'review_required' || value.status === 'review_recommended'
                          ? 'warning'
                          : 'error'
                      }
                      sx={{ mt: 1 }}
                    />
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      Confidence: {(value.confidence * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
          <CardActions>
            <Button
              startIcon={<Visibility />}
              onClick={() => setOpenReportDialog(true)}
            >
              View Detailed Report
            </Button>
          </CardActions>
        </Card>

        {decision.requires_manual_review && (
          <Alert severity="info">
            Your application has been flagged for manual review by an administrator.
            You will be notified once the review is complete.
          </Alert>
        )}

        {decision.action === 'approve' && (
          <Button
            variant="contained"
            color="success"
            onClick={() => setActiveStep(3)}
            fullWidth
          >
            Proceed to Final Step
          </Button>
        )}
      </Box>
    );
  };

  const renderFinalStep = () => (
    <Box textAlign="center">
      <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        Scholarship Application Submitted!
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Your application has been successfully processed. You will receive updates via email and
        notifications.
      </Typography>
      <Button variant="contained" href="/dashboard">
        Go to Dashboard
      </Button>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Scholarship Application & Verification
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Upload your scholarship documents for automated verification
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {showRequestIdForm && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Enter Your Request ID
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            You need a request ID to upload and verify documents. This ID is provided when you submit your scholarship application.
          </Typography>
          
          <Box display="flex" gap={2} alignItems="flex-end">
            <FormControl fullWidth>
              <InputLabel htmlFor="request-id-input">Request ID</InputLabel>
              <OutlinedInput
                id="request-id-input"
                value={requestIdInput}
                onChange={(e) => setRequestIdInput(e.target.value)}
                label="Request ID"
                placeholder="Enter your request ID (e.g., 12345)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleRequestIdSubmit();
                  }
                }}
              />
            </FormControl>
            <Button
              variant="contained"
              onClick={handleRequestIdSubmit}
              disabled={!requestIdInput.trim()}
              sx={{ minWidth: 120 }}
            >
              Continue
            </Button>
          </Box>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Don't have a request ID? <a href="/scholarship">Submit your scholarship application first</a>
            </Typography>
          </Alert>
        </Paper>
      )}

      {!showRequestIdForm && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            <Step>
              <StepLabel>Upload Required Documents</StepLabel>
              <StepContent>{renderUploadStep()}</StepContent>
            </Step>

            <Step>
              <StepLabel>Automated Verification</StepLabel>
              <StepContent>{renderVerificationStep()}</StepContent>
            </Step>

            <Step>
              <StepLabel>Review Results</StepLabel>
              <StepContent>{renderResultsStep()}</StepContent>
            </Step>

            <Step>
              <StepLabel>Final Decision</StepLabel>
              <StepContent>{renderFinalStep()}</StepContent>
            </Step>
          </Stepper>
        </Paper>
      )}

      {/* Detailed Report Dialog */}
      <Dialog
        open={openReportDialog}
        onClose={() => setOpenReportDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detailed Verification Report</DialogTitle>
        <DialogContent>
          <pre style={{ fontSize: '0.85rem', overflow: 'auto' }}>
            {JSON.stringify(verificationResults, null, 2)}
          </pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReportDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ScholarshipVerificationPage;
