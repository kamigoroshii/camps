import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import api from '../services/api';

interface Application {
  request_id: string;
  application_number: string;
  status: string;
  submitted_date: string;
  data: any;
}

const MyApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/scholarship-verification/my-applications');
      if (response.data.success) {
        setApplications(response.data.applications);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'in_review':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">My Scholarship Applications</Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchApplications}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {applications.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No applications found
          </Typography>
          <Button
            variant="contained"
            href="/scholarship"
            sx={{ mt: 2 }}
          >
            Submit New Application
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Application Number</TableCell>
                <TableCell>Submitted Date</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.request_id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {app.application_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(app.submitted_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{app.data?.full_name || '-'}</TableCell>
                  <TableCell>{app.data?.course || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={app.status.toUpperCase()}
                      color={getStatusColor(app.status)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default MyApplicationsPage;
