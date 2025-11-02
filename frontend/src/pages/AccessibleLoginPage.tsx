import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Container,
  Paper,
  Typography,
  Link,
  InputAdornment,
  IconButton,
  Alert,
  Checkbox,
  FormControlLabel,
  Stack,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Google as GoogleIcon,
  GitHub as GitHubIcon,
  School as SchoolIcon,
} from '@mui/icons-material'
import { useFormik } from 'formik'
import * as yup from 'yup'
import { useAuthStore } from '../stores/authStore'
import { OliveButton, OliveInput } from '../components/common'

const validationSchema = yup.object({
  email: yup
    .string()
    .email('Enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
})

export default function AccessibleLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  
  // Refs for focus management
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const submitButtonRef = useRef<HTMLButtonElement>(null)

  // Auto-focus email field on mount for keyboard users
  useEffect(() => {
    emailInputRef.current?.focus()
  }, [])

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true)
      setLoginError('')

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock login - accept any email/password
        const mockUser = {
          id: 1,
          email: values.email,
          username: values.email.split('@')[0],
          full_name: 'John Doe',
          role: values.email.toLowerCase().includes('admin') ? 'admin' : 'student',
          student_id: 'STU2024001',
          department: 'Computer Science',
          status: 'active' as const,
        }

        login(mockUser, 'mock-token-' + Date.now(), values.rememberMe ? '1' : '0')

        // Announce success to screen readers
        const announcement = document.createElement('div')
        announcement.setAttribute('role', 'status')
        announcement.setAttribute('aria-live', 'polite')
        announcement.className = 'sr-only'
        announcement.textContent = 'Login successful. Redirecting to dashboard.'
        document.body.appendChild(announcement)
        setTimeout(() => document.body.removeChild(announcement), 1000)

        // Navigate based on role
        if (mockUser.role === 'admin') {
          navigate('/admin')
        } else {
          navigate('/dashboard')
        }
      } catch (error) {
        setLoginError('Invalid email or password. Please try again.')
        // Focus back to email field for retry
        emailInputRef.current?.focus()
      } finally {
        setIsLoading(false)
      }
    },
  })

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword)
    // Keep focus on password field after toggle
    setTimeout(() => passwordInputRef.current?.focus(), 0)
  }

  // Skip to main content for keyboard users
  const handleSkipToMain = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      emailInputRef.current?.focus()
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#f5f7fa',
      }}
      role="main"
      aria-label="Login page"
    >
      {/* Skip to main content link for keyboard navigation */}
      <Link
        href="#login-form"
        sx={{
          position: 'absolute',
          left: '-9999px',
          top: '20px',
          zIndex: 9999,
          '&:focus': {
            left: '20px',
            bgcolor: '#95A37F',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 600,
            outline: '3px solid #636b2f',
            outlineOffset: '2px',
          },
        }}
        onKeyDown={handleSkipToMain}
        aria-label="Skip to login form"
      >
        Skip to Login Form
      </Link>

      <Container
        maxWidth="sm"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: { xs: 3, sm: 4, md: 6 },
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* Logo and Header */}
        <Box
          sx={{
            textAlign: 'center',
            mb: { xs: 3, sm: 4 },
          }}
          role="banner"
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 64, sm: 80 },
              height: { xs: 64, sm: 80 },
              borderRadius: '50%',
              bgcolor: '#95A37F',
              mb: 2,
            }}
            aria-hidden="true"
          >
            <SchoolIcon sx={{ fontSize: { xs: 36, sm: 48 }, color: 'white' }} />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              color: '#636b2f',
              mb: 1,
              fontSize: { xs: '1.75rem', sm: '2.125rem' },
            }}
          >
            Campus Portal
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '0.875rem', sm: '1rem' },
            }}
            id="login-description"
          >
            Sign in to access your account
          </Typography>
        </Box>

        {/* Login Form */}
        <Paper
          id="login-form"
          component="form"
          onSubmit={formik.handleSubmit}
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
          role="form"
          aria-labelledby="login-description"
          aria-describedby={loginError ? 'login-error' : undefined}
        >
          {/* Error Alert */}
          {loginError && (
            <Alert
              severity="error"
              id="login-error"
              role="alert"
              aria-live="assertive"
              sx={{
                mb: 3,
                '& .MuiAlert-message': {
                  width: '100%',
                },
              }}
              onClose={() => setLoginError('')}
            >
              {loginError}
            </Alert>
          )}

          <Stack spacing={3}>
            {/* Email Field */}
            <Box>
              <OliveInput
                fullWidth
                id="email"
                name="email"
                label="Email Address"
                placeholder="john.doe@example.com"
                type="email"
                autoComplete="email"
                inputRef={emailInputRef}
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                aria-required="true"
                aria-invalid={formik.touched.email && Boolean(formik.errors.email)}
                aria-describedby={
                  formik.touched.email && formik.errors.email ? 'email-error' : undefined
                }
                inputProps={{
                  'aria-label': 'Email address',
                  tabIndex: 0,
                }}
              />
            </Box>

            {/* Password Field */}
            <Box>
              <OliveInput
                fullWidth
                id="password"
                name="password"
                label="Password"
                placeholder="Enter your password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                inputRef={passwordInputRef}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                aria-required="true"
                aria-invalid={formik.touched.password && Boolean(formik.errors.password)}
                aria-describedby={
                  formik.touched.password && formik.errors.password
                    ? 'password-error'
                    : 'password-requirements'
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePasswordVisibility}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        tabIndex={0}
                        sx={{
                          '&:focus': {
                            outline: '2px solid #95A37F',
                            outlineOffset: '2px',
                          },
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                inputProps={{
                  'aria-label': 'Password',
                  tabIndex: 0,
                }}
              />
              <Typography
                id="password-requirements"
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 0.5,
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                }}
                className="sr-only"
              >
                Password must be at least 6 characters long
              </Typography>
            </Box>

            {/* Remember Me & Forgot Password */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 1, sm: 0 },
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    id="rememberMe"
                    name="rememberMe"
                    checked={formik.values.rememberMe}
                    onChange={formik.handleChange}
                    sx={{
                      color: '#95A37F',
                      '&.Mui-checked': {
                        color: '#95A37F',
                      },
                      '&:focus': {
                        outline: '2px solid #95A37F',
                        outlineOffset: '2px',
                      },
                    }}
                    inputProps={{
                      'aria-label': 'Remember me on this device',
                      tabIndex: 0,
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                    Remember me
                  </Typography>
                }
              />
              <Link
                component={RouterLink}
                to="/forgot-password"
                variant="body2"
                sx={{
                  color: '#95A37F',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                  '&:focus': {
                    outline: '2px solid #95A37F',
                    outlineOffset: '2px',
                    borderRadius: '2px',
                  },
                }}
                tabIndex={0}
                aria-label="Forgot your password? Click to reset"
              >
                Forgot password?
              </Link>
            </Box>

            {/* Submit Button */}
            <OliveButton
              type="submit"
              variant="filled"
              size="large"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
              startIcon={<LoginIcon />}
              ref={submitButtonRef}
              aria-label={isLoading ? 'Logging in, please wait' : 'Login to your account'}
              aria-busy={isLoading}
              tabIndex={0}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </OliveButton>

            {/* Divider */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                my: 2,
              }}
              role="separator"
              aria-label="Or continue with"
            >
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                Or continue with
              </Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
            </Box>

            {/* Social Login Buttons */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              role="group"
              aria-label="Social login options"
            >
              <OliveButton
                variant="outlined"
                fullWidth
                startIcon={<GoogleIcon />}
                disabled={isLoading}
                aria-label="Sign in with Google"
                tabIndex={0}
                onClick={() => {
                  // Google OAuth logic
                }}
              >
                Google
              </OliveButton>
              <OliveButton
                variant="outlined"
                fullWidth
                startIcon={<GitHubIcon />}
                disabled={isLoading}
                aria-label="Sign in with GitHub"
                tabIndex={0}
                onClick={() => {
                  // GitHub OAuth logic
                }}
              >
                GitHub
              </OliveButton>
            </Stack>

            {/* Sign Up Link */}
            <Typography
              variant="body2"
              sx={{
                textAlign: 'center',
                color: 'text.secondary',
                fontSize: { xs: '0.875rem', sm: '0.875rem' },
              }}
            >
              Don't have an account?{' '}
              <Link
                component={RouterLink}
                to="/register"
                sx={{
                  color: '#95A37F',
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                  '&:focus': {
                    outline: '2px solid #95A37F',
                    outlineOffset: '2px',
                    borderRadius: '2px',
                  },
                }}
                tabIndex={0}
                aria-label="Sign up for a new account"
              >
                Sign up
              </Link>
            </Typography>
          </Stack>
        </Paper>

        {/* Demo Credentials */}
        <Paper
          sx={{
            mt: 3,
            p: { xs: 2, sm: 3 },
            bgcolor: '#e8f0e0',
            border: '2px solid #95A37F',
            borderRadius: 2,
          }}
          role="complementary"
          aria-labelledby="demo-credentials-title"
        >
          <Typography
            id="demo-credentials-title"
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: '#636b2f',
              mb: 1,
              fontSize: { xs: '0.875rem', sm: '1rem' },
            }}
          >
            🔑 Demo Credentials
          </Typography>
          <Stack spacing={1}>
            <Typography
              variant="body2"
              sx={{
                color: '#636b2f',
                fontFamily: 'monospace',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
            >
              <strong>Student:</strong> student@example.com / any password
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#636b2f',
                fontFamily: 'monospace',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
            >
              <strong>Admin:</strong> admin@example.com / any password
            </Typography>
          </Stack>
        </Paper>

        {/* Accessibility Info */}
        <Typography
          variant="caption"
          sx={{
            textAlign: 'center',
            color: 'text.secondary',
            mt: 3,
            display: 'block',
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
          }}
          role="contentinfo"
        >
          This page is fully keyboard navigable. Press Tab to navigate, Enter to activate.
        </Typography>
      </Container>

      {/* Screen reader only status messages */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isLoading && 'Login in progress'}
      </div>

      {/* Global styles for screen reader only content */}
      <style>{`
        .sr-only {
          position: absolute;
          left: -10000px;
          width: 1px;
          height: 1px;
          overflow: hidden;
        }
      `}</style>
    </Box>
  )
}
