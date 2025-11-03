import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableRow,
  LinearProgress
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Pending as PendingIcon,
  Description as DocumentIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import api from '../services/api';

interface ApplicationData {
  full_name: string;
  email: string;
  phone: string;
  course: string;
  year_of_study: string;
  reason: string;
}

interface UploadedDocument {
  id: string;
  type: string;
  filename: string;
  status: string;
  uploaded_at?: string;
}

interface Application {
  request_id: string;
  application_number: string;
  status: string;
  submitted_date: string;
  data: ApplicationData;
  documents?: UploadedDocument[];
}

const steps = ['Application Form', 'Document Upload', 'Review & Submit'];

const documentTypes = [
  'ID Proof (Aadhar/Passport)',
  'Mark Sheets (10th)',
  'Mark Sheets (12th)',
  'Income Certificate',
  'Caste Certificate',
  'Bank Passbook',
  'Passport Photo'
];

export default function ScholarshipUnifiedPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Application Form State
  const [formData, setFormData] = useState<ApplicationData>({
    full_name: '',
    email: '',
    phone: '',
    course: '',
    year_of_study: '',
    reason: ''
  });
  
  // Application State
  const [requestId, setRequestId] = useState<string | null>(null);
  const [applicationNumber, setApplicationNumber] = useState<string | null>(null);
  
  // Document Upload State
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  
  // My Applications State
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  
  // Verification Dialog State
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState<any>(null);
  const [loadingVerification, setLoadingVerification] = useState(false);
  
  // Delete Confirmation Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadMyApplications();
  }, []);

  const loadMyApplications = async () => {
    try {
      const response = await api.get('/scholarship-verification/my-applications');
      const applications = response.data.applications || [];
      
      // Load documents for each application
      const appsWithDocs = await Promise.all(
        applications.map(async (app: Application) => {
          try {
            const docResponse = await api.get(`/scholarship-verification/status/${app.request_id}`);
            return {
              ...app,
              documents: docResponse.data.documents || []
            };
          } catch (err) {
            console.error(`Failed to load documents for ${app.request_id}:`, err);
            return { ...app, documents: [] };
          }
        })
      );
      
      setMyApplications(appsWithDocs);
    } catch (err: any) {
      console.error('Failed to load applications:', err);
    }
  };

  const handleInputChange = (field: keyof ApplicationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = () => {
    const required = ['full_name', 'email', 'phone', 'course', 'year_of_study', 'reason'];
    for (const field of required) {
      if (!formData[field as keyof ApplicationData]?.trim()) {
        setError(`${field.replace('_', ' ')} is required`);
        return false;
      }
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    
    return true;
  };

  const handleNext = async () => {
    setError(null);
    setSuccess(null);

    if (activeStep === 0) {
      // Submit Application
      if (!validateForm()) return;

      setLoading(true);
      try {
        const response = await api.post('/scholarship-verification/submit', formData);
        
        if (response.data.success) {
          setRequestId(response.data.request_id);
          setApplicationNumber(response.data.application_number);
          setSuccess(response.data.message);
          
          // Store in localStorage
          localStorage.setItem('scholarshipRequestId', response.data.request_id);
          localStorage.setItem('scholarshipApplicationNumber', response.data.application_number);
          
          setActiveStep(1);
          await loadMyApplications();
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to submit application');
      } finally {
        setLoading(false);
      }
    } else if (activeStep === 1) {
      // Move to review step
      if (uploadedDocs.length === 0) {
        setError('Please upload at least one document');
        return;
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      // Final submission
      setSuccess('Application submitted successfully! You will be notified of the status.');
      setTimeout(() => {
        // Reset form for new application
        resetForm();
      }, 3000);
    }
  };

  const handleBack = () => {
    setError(null);
    setSuccess(null);
    setActiveStep((prev) => prev - 1);
  };

  const resetForm = () => {
    setActiveStep(0);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      course: '',
      year_of_study: '',
      reason: ''
    });
    setRequestId(null);
    setApplicationNumber(null);
    setUploadedDocs([]);
    setError(null);
    setSuccess(null);
    localStorage.removeItem('scholarshipRequestId');
    localStorage.removeItem('scholarshipApplicationNumber');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = event.target.files?.[0];
    if (!file || !requestId) {
      console.error('Cannot upload: file or requestId missing', { file: !!file, requestId });
      setError('Please submit an application first');
      return;
    }

    console.log('Uploading document:', { docType, requestId, filename: file.name });
    setUploadingDoc(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', docType);

      console.log('Calling API:', `/scholarship-verification/upload/${requestId}`);
      const response = await api.post(
        `/scholarship-verification/upload/${requestId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        setUploadedDocs((prev) => [
          ...prev,
          {
            id: response.data.document_id,
            type: docType,
            filename: file.name,
            status: response.data.verification_status,
          },
        ]);
        setSuccess(`${docType} uploaded successfully!`);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to upload ${docType}`);
    } finally {
      setUploadingDoc(false);
    }
  };

  const loadApplicationForEdit = async (application: Application) => {
    console.log('Loading application for edit:', application);
    console.log('Setting request_id to:', application.request_id);
    setSelectedApplication(application);
    setFormData(application.data);
    setRequestId(application.request_id);
    setApplicationNumber(application.application_number);
    
    // Load existing documents for this application
    try {
      const response = await api.get(`/scholarship-verification/status/${application.request_id}`);
      if (response.data.documents) {
        setUploadedDocs(response.data.documents);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
    
    setActiveStep(1); // Go to document upload step
  };

  const handleViewDocument = async (documentId: string) => {
    try {
      const response = await api.get(`/scholarship-verification/document/${documentId}`, {
        responseType: 'blob'
      });
      
      // Create a blob URL and open in new tab
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Clean up the URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (err: any) {
      setError('Failed to view document');
      console.error('Error viewing document:', err);
    }
  };

  const handleDownloadDocument = async (documentId: string, filename: string) => {
    try {
      const response = await api.get(`/scholarship-verification/document/${documentId}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to download document');
      console.error('Error downloading document:', err);
    }
  };

  const handleViewVerification = async (reqId: string) => {
    setLoadingVerification(true);
    setVerificationDialogOpen(true);
    try {
      const response = await api.get(`/scholarship-verification/verification-details/${reqId}`);
      setVerificationDetails(response.data);
    } catch (err: any) {
      setError('Failed to load verification details');
      console.error('Error loading verification:', err);
      setVerificationDialogOpen(false);
    } finally {
      setLoadingVerification(false);
    }
  };

  const handleCloseVerificationDialog = () => {
    setVerificationDialogOpen(false);
    setVerificationDetails(null);
  };

  const handleDeleteClick = (application: Application) => {
    setApplicationToDelete(application);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!applicationToDelete) return;
    
    setDeleting(true);
    try {
      const response = await api.delete(`/scholarship-verification/delete/${applicationToDelete.request_id}`);
      
      if (response.data.success) {
        setSuccess(`Application ${applicationToDelete.application_number} deleted successfully`);
        setDeleteDialogOpen(false);
        setApplicationToDelete(null);
        
        // Reload applications list
        await loadMyApplications();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete application');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setApplicationToDelete(null);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Scholarship Application Form
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Course"
                    value={formData.course}
                    onChange={(e) => handleInputChange('course', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Year of Study"
                    value={formData.year_of_study}
                    onChange={(e) => handleInputChange('year_of_study', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Reason for Scholarship"
                    multiline
                    rows={4}
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    required
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Document Upload & Verification
              </Typography>
              {requestId ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <strong>Application Number:</strong> {applicationNumber}<br />
                  <Typography variant="caption" component="span">Request ID: {requestId}</Typography>
                </Alert>
              ) : (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Please submit an application first to upload documents
                </Alert>
              )}
              
              <Grid container spacing={2}>
                {documentTypes.map((docType, index) => {
                  const uploadedDoc = uploadedDocs.find(doc => doc.type === docType);
                  
                  return (
                    <Grid item xs={12} md={6} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" flexDirection="column" gap={2}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                              <Box flex={1}>
                                <Typography variant="subtitle2">{docType}</Typography>
                                {uploadedDoc && (
                                  <Box mt={1}>
                                    <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
                                      <Chip
                                        icon={uploadedDoc.status === 'verified' ? <CheckIcon /> : <PendingIcon />}
                                        label={uploadedDoc.status}
                                        color={uploadedDoc.status === 'verified' ? 'success' : 'warning'}
                                        size="small"
                                      />
                                      <Typography variant="caption" noWrap sx={{ maxWidth: '150px' }}>
                                        {uploadedDoc.filename}
                                      </Typography>
                                    </Box>
                                    {uploadedDoc.uploaded_at && (
                                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                        {new Date(uploadedDoc.uploaded_at).toLocaleString()}
                                      </Typography>
                                    )}
                                  </Box>
                                )}
                              </Box>
                            </Box>
                            
                            <Box display="flex" gap={1} flexWrap="wrap">
                              {uploadedDoc && (
                                <>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<ViewIcon />}
                                    onClick={() => handleViewDocument(uploadedDoc.id)}
                                  >
                                    View
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<DownloadIcon />}
                                    onClick={() => handleDownloadDocument(uploadedDoc.id, uploadedDoc.filename)}
                                  >
                                    Download
                                  </Button>
                                </>
                              )}
                              <input
                                accept=".pdf,.jpg,.jpeg,.png"
                                style={{ display: 'none' }}
                                id={`upload-${index}`}
                                type="file"
                                onChange={(e) => handleFileUpload(e, docType)}
                              />
                              <label htmlFor={`upload-${index}`}>
                                <Button
                                  variant="outlined"
                                  component="span"
                                  startIcon={<UploadIcon />}
                                  disabled={uploadingDoc}
                                  size="small"
                                >
                                  {uploadedDoc ? 'Replace' : 'Upload'}
                                </Button>
                              </label>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              {uploadingDoc && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <CircularProgress />
                </Box>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Review & Submit
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                Application Details:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Name" secondary={formData.full_name} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Email" secondary={formData.email} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Course" secondary={formData.course} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Year" secondary={formData.year_of_study} />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>
                Uploaded Documents ({uploadedDocs.length}):
              </Typography>
              <List dense>
                {uploadedDocs.map((doc, index) => (
                  <ListItem 
                    key={index}
                    secondaryAction={
                      <Box display="flex" gap={1}>
                        <Button
                          size="small"
                          startIcon={<ViewIcon />}
                          onClick={() => handleViewDocument(doc.id)}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadDocument(doc.id, doc.filename)}
                        >
                          Download
                        </Button>
                      </Box>
                    }
                  >
                    <ListItemIcon>
                      <DocumentIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.type}
                      secondary={doc.filename}
                    />
                    <Chip
                      label={doc.status}
                      color={doc.status === 'verified' ? 'success' : 'warning'}
                      size="small"
                      sx={{ mr: 2 }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Scholarship Portal
      </Typography>

      {/* My Applications Section */}
      {myApplications.length > 0 && activeStep === 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              My Applications
            </Typography>
            <Grid container spacing={2}>
              {myApplications.map((app, index) => (
                <Grid item xs={12} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {app.application_number}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {app.data.full_name} - {app.data.course}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Submitted: {new Date(app.submitted_date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Documents: {app.documents?.length || 0} uploaded
                          </Typography>
                        </Box>
                        <Box display="flex" flexDirection="column" gap={1} alignItems="flex-end">
                          <Chip
                            label={app.status}
                            color={app.status === 'COMPLETED' ? 'success' : 'warning'}
                            size="small"
                          />
                          <Box display="flex" gap={1} flexWrap="wrap">
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => loadApplicationForEdit(app)}
                            >
                              Manage Docs
                            </Button>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<AssessmentIcon />}
                              onClick={() => handleViewVerification(app.request_id)}
                            >
                              Verification
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleDeleteClick(app)}
                            >
                              Delete
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                      
                      {app.documents && app.documents.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Uploaded Documents:
                          </Typography>
                          <Grid container spacing={1}>
                            {app.documents.map((doc, docIndex) => (
                              <Grid item xs={12} sm={6} key={docIndex}>
                                <Box 
                                  display="flex" 
                                  alignItems="center" 
                                  justifyContent="space-between"
                                  p={1}
                                  sx={{ 
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1
                                  }}
                                >
                                  <Box display="flex" alignItems="center" gap={1} flex={1}>
                                    <DocumentIcon fontSize="small" />
                                    <Box>
                                      <Typography variant="caption" display="block" fontWeight="medium">
                                        {doc.type}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '150px' }}>
                                        {doc.filename}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <Box display="flex" gap={0.5}>
                                    <Button
                                      size="small"
                                      variant="text"
                                      onClick={() => handleViewDocument(doc.id)}
                                      sx={{ minWidth: 'auto', p: 0.5 }}
                                    >
                                      <ViewIcon fontSize="small" />
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="text"
                                      onClick={() => handleDownloadDocument(doc.id, doc.filename)}
                                      sx={{ minWidth: 'auto', p: 0.5 }}
                                    >
                                      <DownloadIcon fontSize="small" />
                                    </Button>
                                  </Box>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Main Application Flow */}
      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {renderStepContent()}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
          >
            Back
          </Button>
          
          <Box>
            {activeStep < steps.length - 1 && (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {activeStep === 0 ? 'Submit Application' : 'Next'}
              </Button>
            )}
            
            {activeStep === steps.length - 1 && (
              <Button
                variant="contained"
                onClick={handleNext}
                color="success"
              >
                Final Submit
              </Button>
            )}
            
            {activeStep === 0 && (
              <Button
                variant="outlined"
                onClick={resetForm}
                sx={{ ml: 1 }}
              >
                New Application
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Verification Details Dialog */}
      <Dialog 
        open={verificationDialogOpen} 
        onClose={handleCloseVerificationDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AssessmentIcon />
            <Typography variant="h6">Verification Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingVerification ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : verificationDetails ? (
            <Box>
              {/* Overall Score */}
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
                        color={verificationDetails.overall_score >= 0.7 ? 'success' : 'warning'}
                      />
                    </Box>
                    <Typography variant="h6">
                      {((verificationDetails.overall_score || 0) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Application: {verificationDetails.application_number}
                  </Typography>
                </CardContent>
              </Card>

              {/* Documents */}
              <Typography variant="subtitle1" gutterBottom>
                Document Verification Results
              </Typography>
              {verificationDetails.documents?.map((doc: any, index: number) => {
                const docVerification = verificationDetails.verification_results?.[doc.type];
                return (
                  <Card key={index} sx={{ mb: 2 }} variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle2">{doc.type}</Typography>
                        <Chip 
                          label={doc.is_verified ? 'Verified' : 'Pending Review'}
                          color={doc.is_verified ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                      
                      {docVerification && (
                        <Table size="small">
                          <TableBody>
                            <TableRow>
                              <TableCell><strong>OCR Confidence</strong></TableCell>
                              <TableCell>
                                {(docVerification.ocr_confidence * 100).toFixed(1)}%
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell><strong>Identity Check</strong></TableCell>
                              <TableCell>
                                {docVerification.identity_check?.is_valid ? '✓ Passed' : '✗ Failed'} 
                                ({(docVerification.identity_check?.confidence * 100).toFixed(1)}%)
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell><strong>Authenticity Check</strong></TableCell>
                              <TableCell>
                                {docVerification.authenticity_check?.is_authentic ? '✓ Passed' : '✗ Failed'} 
                                ({(docVerification.authenticity_check?.confidence * 100).toFixed(1)}%)
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell><strong>Overall Confidence</strong></TableCell>
                              <TableCell>
                                <strong>{(docVerification.overall_confidence * 100).toFixed(1)}%</strong>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      )}
                      
                      {doc.ocr_text && (
                        <Box mt={2}>
                          <Typography variant="caption" display="block" color="text.secondary">
                            Extracted Text (preview):
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            mt: 1, 
                            p: 1, 
                            bgcolor: 'grey.100', 
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            maxHeight: '100px',
                            overflow: 'auto'
                          }}>
                            {doc.ocr_text}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          ) : (
            <Typography>No verification details available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVerificationDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <DeleteIcon color="error" />
            <Typography variant="h6">Delete Application</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {applicationToDelete && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This action cannot be undone!
              </Alert>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to delete this application?
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2">Application Details:</Typography>
                <Typography variant="body2">
                  <strong>Application Number:</strong> {applicationToDelete.application_number}
                </Typography>
                <Typography variant="body2">
                  <strong>Name:</strong> {applicationToDelete.data.full_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Course:</strong> {applicationToDelete.data.course}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {applicationToDelete.status}
                </Typography>
                {applicationToDelete.documents && applicationToDelete.documents.length > 0 && (
                  <Typography variant="body2" color="error">
                    <strong>Warning:</strong> {applicationToDelete.documents.length} document(s) will also be deleted
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete Application'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}