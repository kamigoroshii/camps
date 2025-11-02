import { Component, ErrorInfo, ReactNode } from 'react'
import { Box, Paper, Typography, Button, Alert } from '@mui/material'
import { Error as ErrorIcon, Refresh as RefreshIcon, Home as HomeIcon } from '@mui/icons-material'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export default class OliveErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#f5f5f5',
            p: 3,
          }}
        >
          <Paper
            sx={{
              maxWidth: 600,
              width: '100%',
              p: 4,
              borderRadius: 2,
              border: '2px solid #95A37F',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <ErrorIcon
                sx={{
                  fontSize: 80,
                  color: '#95A37F',
                  mb: 2,
                }}
              />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  color: '#636b2f',
                  mb: 1,
                }}
              >
                Oops! Something went wrong
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                We're sorry for the inconvenience. An unexpected error has occurred.
              </Typography>
            </Box>

            {this.state.error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  '& .MuiAlert-icon': {
                    color: '#d32f2f',
                  },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Error Details:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {this.state.error.message}
                </Typography>
              </Alert>
            )}

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  bgcolor: '#e8f0e0',
                  borderRadius: 1,
                  border: '1px solid #95A37F',
                  maxHeight: 200,
                  overflow: 'auto',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: '#636b2f',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.errorInfo.componentStack}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleReset}
                sx={{
                  bgcolor: '#95A37F',
                  color: 'white',
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#95A37F',
                    opacity: 0.95,
                  },
                  '&:focus': {
                    outline: '2px solid #95A37F',
                    outlineOffset: 2,
                  },
                }}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={this.handleGoHome}
                sx={{
                  borderColor: '#95A37F',
                  color: '#95A37F',
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  borderWidth: 2,
                  '&:hover': {
                    borderColor: '#95A37F',
                    bgcolor: '#e8f0e0',
                    borderWidth: 2,
                  },
                  '&:focus': {
                    outline: '2px solid #95A37F',
                    outlineOffset: 2,
                  },
                }}
              >
                Go Home
              </Button>
            </Box>
          </Paper>
        </Box>
      )
    }

    return this.props.children
  }
}
