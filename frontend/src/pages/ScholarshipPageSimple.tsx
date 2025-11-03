import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  Grid,
} from '@mui/material';
import { CloudUpload, CheckCircle, Description } from '@mui/icons-material';
import api from '../services/api';

const steps = ['Application Details', 'Upload Documents', 'Review & Submit'];

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
}

const ScholarshipPageSimple: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [applicationNumber, setApplicationNumber] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState<ApplicationData>({
    full_name: '',
    email: '',
    phone: '',
    course: '',
    year_of_study: '',
    reason: '',
  });

  // Document uploads
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = async () => {
    setError(null);
    setSuccess(null);

    if (activeStep === 0) {
      // Validate form
      if (!formData.full_name || !formData.email || !formData.phone || 
          !formData.course || !formData.year_of_study || !formData.reason) {
        setError('Please fill in all required fields');
        return;
      }

      // Submit application
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
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to submit application');
      } finally {
        setLoading(false);
      }
    } else if (activeStep === 1) {
      // Move to review
      if (uploadedDocs.length === 0) {
        setError('Please upload at least one document');
        return;
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      // Final submission
      setSuccess('Application submitted successfully! You will be notified of the status.');
      setTimeout(() => {
        // Could redirect to applications list
        window.location.href = '/scholarship/my-applications';
      }, 2000);
    }
  };

  const handleBack = () => {
    setError(null);
    setSuccess(null);
    setActiveStep((prev) => prev - 1);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = event.target.files?.[0];
    if (!file || !requestId) return;

    setUploadingDoc(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', docType);

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

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Full Name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Course"
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Year of Study"
                  name="year_of_study"
                  value={formData.year_of_study}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={4}
                  label="Reason for Scholarship"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Upload Documents
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Application Number: <strong>{applicationNumber}</strong>
            </Alert>

            <Grid container spacing={2}>
              {['ID Proof', 'Income Certificate', 'Academic Records'].map((docType) => (
                <Grid item xs={12} key={docType}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1">{docType}</Typography>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<CloudUpload />}
                          disabled={uploadingDoc}
                        >
                          Upload
                          <input
                            type="file"
                            hidden
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(e, docType)}
                          />
                        </Button>
                      </Box>
                      {uploadedDocs.find((d) => d.type === docType) && (
                        <Box mt={1} display="flex" alignItems="center">
                          <CheckCircle color="success" fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2" color="success.main">
                            {uploadedDocs.find((d) => d.type === docType)?.filename}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {uploadedDocs.length > 0 && (
              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Uploaded Documents ({uploadedDocs.length})
                </Typography>
                <List>
                  {uploadedDocs.map((doc) => (
                    <ListItem key={doc.id}>
                      <Description sx={{ mr: 2 }} />
                      <ListItemText primary={doc.type} secondary={doc.filename} />
                      <Chip
                        label={doc.status}
                        color={doc.status === 'verified' ? 'success' : 'default'}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Application
            </Typography>

            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Application Number
                </Typography>
                <Typography variant="h6">{applicationNumber}</Typography>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Personal Details
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Name:
                    </Typography>
                    <Typography variant="body1">{formData.full_name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Email:
                    </Typography>
                    <Typography variant="body1">{formData.email}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Phone:
                    </Typography>
                    <Typography variant="body1">{formData.phone}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Course:
                    </Typography>
                    <Typography variant="body1">{formData.course}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Documents Uploaded: {uploadedDocs.length}
                </Typography>
                {uploadedDocs.map((doc) => (
                  <Chip key={doc.id} label={doc.type} sx={{ mr: 1, mb: 1 }} />
                ))}
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Scholarship Application
        </Typography>

        <Stepper activeStep={activeStep} sx={{ my: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

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

        {renderStepContent()}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading || uploadingDoc}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {activeStep === steps.length - 1 ? 'Submit Application' : 'Next'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ScholarshipPageSimple;
