import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
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
} from '@mui/icons-material'
import { useFormik } from 'formik'
import * as yup from 'yup'
import { toast } from 'react-toastify'
import api from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { palette, gradients } from '../theme'

const validationSchema = yup.object({
  email: yup
    .string()
    .email('Enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .max(72, 'Password cannot be longer than 72 characters')
    .required('Password is required'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true)
      setError(null)

      try {
        // Real backend authentication
        const response = await api.post('/mongo-auth/login', {
          username_or_email: values.email,
          password: values.password,
        })
        const { user, access_token, refresh_token } = response.data
        login(user, access_token, refresh_token)
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true')
        }
        toast.success(`Welcome back, ${user.full_name || user.username || user.email}!`)
        // Debug logging
        console.log('Login response user:', user)
        const role = user?.role?.toLowerCase()
        console.log('User role:', role)
        // Redirect admin and super_admin users to /admin, others to /dashboard
        if (role === 'admin' || role === 'super_admin') {
          console.log('Redirecting to /admin')
          navigate('/admin')
        } else {
          console.log('Redirecting to /dashboard')
          navigate('/dashboard')
        }
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          'Invalid email or password. Please try again.'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
  })

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword)
  }

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
  }

  // TODO: Implement OAuth 2.0 login handlers
  const handleGoogleLogin = () => {
    toast.info('Google OAuth login coming soon!')
    // window.location.href = '/api/auth/google'
  }

  const handleGitHubLogin = () => {
    toast.info('GitHub OAuth login coming soon!')
    // window.location.href = '/api/auth/github'
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: gradients.primarySubtle,
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 3,
            border: `1px solid ${palette.borderLight}`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Avatar
              sx={{
                width: 72,
                height: 72,
                bgcolor: palette.primary,
                mb: 2,
                fontSize: '1.75rem',
                fontWeight: 700,
              }}
            >
              CP
            </Avatar>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                color: palette.textPrimary,
                textAlign: 'center',
              }}
            >
              Welcome Back
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              align="center"
              sx={{ maxWidth: 400 }}
            >
              Sign in to access your Campus Portal account
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                bgcolor: 'rgba(211, 47, 47, 0.05)',
                color: palette.error,
                '& .MuiAlert-icon': {
                  color: palette.error,
                },
              }} 
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              type="email"
              autoComplete="email"
              autoFocus
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              disabled={isLoading}
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: palette.gray300,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: palette.primary,
                    borderWidth: 2,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: palette.primary,
                },
              }}
            />

            <TextField
              fullWidth
              id="password"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                      disabled={isLoading}
                      sx={{ color: palette.textSecondary }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: palette.gray300,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: palette.primary,
                    borderWidth: 2,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: palette.primary,
                },
              }}
            />

            {/* Remember Me & Forgot Password */}
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    sx={{
                      color: palette.primary,
                      '&.Mui-checked': {
                        color: palette.primary,
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                    Remember me
                  </Typography>
                }
              />
              
              <Link
                component={RouterLink}
                to="/forgot-password"
                variant="body2"
                sx={{
                  color: palette.primary,
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Forgot password?
              </Link>
            </Box>

            {/* Login Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <LoginIcon />}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                bgcolor: palette.primary,
                color: palette.white,
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: palette.primaryDark,
                  boxShadow: 'none',
                },
                '&:disabled': {
                  bgcolor: palette.gray200,
                  color: palette.gray500,
                },
                mb: 3,
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            {/* OAuth Divider */}
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" sx={{ color: palette.textSecondary, px: 2 }}>
                Or continue with
              </Typography>
            </Divider>

            {/* OAuth Buttons */}
            <Stack spacing={2} sx={{ mb: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                startIcon={<GoogleIcon />}
                sx={{
                  py: 1.25,
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  borderColor: palette.gray300,
                  color: palette.textPrimary,
                  '&:hover': {
                    borderColor: palette.primary,
                    bgcolor: 'transparent',
                  },
                }}
              >
                Continue with Google
              </Button>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={handleGitHubLogin}
                disabled={isLoading}
                startIcon={<GitHubIcon />}
                sx={{
                  py: 1.25,
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  borderColor: palette.gray300,
                  color: palette.textPrimary,
                  '&:hover': {
                    borderColor: palette.primary,
                    bgcolor: 'transparent',
                  },
                }}
              >
                Continue with GitHub
              </Button>
            </Stack>

            {/* Register Link */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" sx={{ color: palette.textSecondary, mb: 1.5 }}>
                Don't have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  sx={{
                    color: palette.primary,
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Create Account
                </Link>
              </Typography>
            </Box>
          </form>

        </Paper>

        {/* Footer */}
        <Typography 
          variant="body2" 
          sx={{ 
            mt: 4, 
            textAlign: 'center',
            color: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          © {new Date().getFullYear()} Campus Portal. All rights reserved.
        </Typography>
      </Container>
    </Box>
  )
}
