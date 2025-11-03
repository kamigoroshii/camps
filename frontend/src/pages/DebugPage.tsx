import React from 'react';
import { Typography, Button, Box, Alert } from '@mui/material';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

const DebugPage: React.FC = () => {
  const { user, accessToken, isAuthenticated } = useAuthStore();
  const [testResults, setTestResults] = React.useState<any>(null);

  const testBackendConnection = async () => {
    try {
      // Test without auth
      const noAuthResponse = await api.get('/test/test-no-auth');
      console.log('No auth test:', noAuthResponse.data);

      // Test with auth
      const authResponse = await api.get('/requests');
      console.log('Auth test:', authResponse.data);

      setTestResults({
        noAuth: noAuthResponse.data,
        auth: authResponse.data,
        error: null
      });
    } catch (error: any) {
      console.error('Test error:', error);
      setTestResults({
        noAuth: null,
        auth: null,
        error: error.message
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Debug Information
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">Authentication Status:</Typography>
        <Typography>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Typography>
        <Typography>User: {user ? JSON.stringify(user, null, 2) : 'None'}</Typography>
        <Typography>Token: {accessToken ? `${accessToken.substring(0, 20)}...` : 'None'}</Typography>
      </Box>

      <Button variant="contained" onClick={testBackendConnection} sx={{ mb: 2 }}>
        Test Backend Connection
      </Button>

      {testResults && (
        <Box>
          {testResults.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Error: {testResults.error}
            </Alert>
          )}
          {testResults.noAuth && (
            <Alert severity="success" sx={{ mb: 2 }}>
              No-Auth Test: {JSON.stringify(testResults.noAuth)}
            </Alert>
          )}
          {testResults.auth && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Auth Test: {JSON.stringify(testResults.auth)}
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default DebugPage;