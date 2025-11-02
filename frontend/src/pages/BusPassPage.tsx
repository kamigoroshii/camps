import { useState } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Chip,
  Divider,
} from '@mui/material'
import {
  DirectionsBus as BusIcon,
  LocationOn as LocationIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
} from '@mui/icons-material'

interface BusPass {
  id: string
  route: string
  validFrom: string
  validTo: string
  status: 'active' | 'expired' | 'pending'
}

const busRoutes = [
  { value: 'route-1', label: 'Route 1: ECIL - College' },
  { value: 'route-2', label: 'Route 2: LB Nagar - College' },
  { value: 'route-3', label: 'Route 3: Dilsukhnagar - College' },
  { value: 'route-4', label: 'Route 4: Kukatpally - College' },
  { value: 'route-5', label: 'Route 5: Miyapur - College' },
]

export default function BusPassPage() {
  const [selectedRoute, setSelectedRoute] = useState('')
  const [boardingPoint, setBoardingPoint] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const [currentPass] = useState<BusPass>({
    id: 'BP-2024-001',
    route: 'Route 1: ECIL - College',
    validFrom: '2024-11-01',
    validTo: '2024-11-30',
    status: 'active',
  })

  const handleSubmit = () => {
    if (selectedRoute && boardingPoint) {
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setSelectedRoute('')
        setBoardingPoint('')
      }, 3000)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#2e7d32'
      case 'pending':
        return '#ed6c02'
      case 'expired':
        return '#757575'
      default:
        return '#757575'
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#e8f5e9'
      case 'pending':
        return '#fff3e0'
      case 'expired':
        return '#f5f5f5'
      default:
        return '#f5f5f5'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon sx={{ fontSize: 18 }} />
      case 'pending':
        return <PendingIcon sx={{ fontSize: 18 }} />
      default:
        return null
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#95A37F', mb: 1 }}>
          Bus Pass Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Apply for and manage your college bus pass
        </Typography>
      </Box>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Bus pass application submitted successfully! You will receive your pass within 2 working days.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Current Pass */}
        {currentPass && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 2, border: '2px solid #95A37F', bgcolor: '#f9faf7' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <BusIcon sx={{ fontSize: 40, color: '#95A37F' }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#636b2f' }}>
                      Active Bus Pass
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pass ID: {currentPass.id}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  icon={getStatusIcon(currentPass.status) || undefined}
                  label={currentPass.status.toUpperCase()}
                  sx={{
                    bgcolor: getStatusBgColor(currentPass.status),
                    color: getStatusColor(currentPass.status),
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    border: `1.5px solid ${getStatusColor(currentPass.status)}`,
                    '& .MuiChip-icon': {
                      color: getStatusColor(currentPass.status),
                    },
                  }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <BusIcon sx={{ color: '#95A37F', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Route
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {currentPass.route}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalendarIcon sx={{ color: '#95A37F', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Valid From
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(currentPass.validFrom).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalendarIcon sx={{ color: '#95A37F', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Valid Until
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(currentPass.validTo).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: '#95A37F',
                    color: 'white',
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#7a8566' },
                    '&:focus': { outline: '2px solid #95A37F', outlineOffset: 2 },
                  }}
                >
                  Download Pass
                </Button>
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: '#95A37F',
                    color: '#95A37F',
                    fontWeight: 600,
                    borderWidth: 2,
                    '&:hover': {
                      borderColor: '#95A37F',
                      bgcolor: '#e8f0e0',
                      borderWidth: 2,
                    },
                    '&:focus': { outline: '2px solid #95A37F', outlineOffset: 2 },
                  }}
                >
                  View QR Code
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Apply for New Pass */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#636b2f', mb: 3 }}>
              Apply for New Bus Pass
            </Typography>

            <FormControl
              fullWidth
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                  borderColor: '#95A37F',
                  borderWidth: '2px',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#95A37F',
                },
              }}
            >
              <InputLabel>Select Route</InputLabel>
              <Select
                value={selectedRoute}
                label="Select Route"
                onChange={(e) => setSelectedRoute(e.target.value)}
              >
                {busRoutes.map((route) => (
                  <MenuItem key={route.value} value={route.value}>
                    {route.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Boarding Point"
              value={boardingPoint}
              onChange={(e) => setBoardingPoint(e.target.value)}
              placeholder="Enter your boarding point location"
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                  borderColor: '#95A37F',
                  borderWidth: '2px',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#95A37F',
                },
              }}
              InputProps={{
                startAdornment: <LocationIcon sx={{ color: '#95A37F', mr: 1 }} />,
              }}
            />

            <Alert severity="info" sx={{ mb: 3 }}>
              Bus pass is valid for one month from the date of issue. Monthly fee: ₹500
            </Alert>

            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmit}
              disabled={!selectedRoute || !boardingPoint}
              sx={{
                bgcolor: '#95A37F',
                color: 'white',
                py: 1.5,
                fontWeight: 600,
                fontSize: '1rem',
                '&:hover': { bgcolor: '#7a8566' },
                '&:focus': { outline: '2px solid #95A37F', outlineOffset: 2 },
                '&:disabled': {
                  bgcolor: '#e0e0e0',
                  color: '#9e9e9e',
                },
              }}
            >
              Apply for Bus Pass
            </Button>
          </Paper>
        </Grid>

        {/* Bus Routes & Timings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#636b2f', mb: 3 }}>
              Available Routes & Timings
            </Typography>

            {busRoutes.map((route) => (
              <Card key={route.value} sx={{ mb: 2, border: '1px solid #E0E0E0' }}>
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <BusIcon sx={{ color: '#95A37F' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {route.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Morning: 7:30 AM | Evening: 5:00 PM
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}

            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Please arrive at the boarding point 5 minutes before departure time.
              </Typography>
            </Alert>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
