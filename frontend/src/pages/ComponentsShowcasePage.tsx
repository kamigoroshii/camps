import { useState } from 'react'
import { Container, Typography, Paper, Grid, Box } from '@mui/material'
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import {
  OliveButton,
  OliveInput,
  OliveBadge,
  OliveLoader,
  OliveErrorBoundary,
} from '../components/common'

export default function ComponentsShowcasePage() {
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const handleLoadingTest = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" sx={{ fontWeight: 700, color: '#636b2f', mb: 1 }}>
        Olive Component Library
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Reusable components with olive palette, focus states, and minimal hover effects
      </Typography>

      {/* Buttons */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#95A37F', mb: 3 }}>
          OliveButton
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Variants
          </Typography>
          <Grid container spacing={2}>
            <Grid item>
              <OliveButton variant="filled">Filled Button</OliveButton>
            </Grid>
            <Grid item>
              <OliveButton variant="outlined">Outlined Button</OliveButton>
            </Grid>
            <Grid item>
              <OliveButton variant="text">Text Button</OliveButton>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Sizes
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <OliveButton size="small">Small</OliveButton>
            </Grid>
            <Grid item>
              <OliveButton size="medium">Medium</OliveButton>
            </Grid>
            <Grid item>
              <OliveButton size="large">Large</OliveButton>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            With Icons
          </Typography>
          <Grid container spacing={2}>
            <Grid item>
              <OliveButton startIcon={<AddIcon />}>Create New</OliveButton>
            </Grid>
            <Grid item>
              <OliveButton variant="outlined" startIcon={<DownloadIcon />}>
                Download
              </OliveButton>
            </Grid>
            <Grid item>
              <OliveButton variant="text" startIcon={<DeleteIcon />}>
                Remove
              </OliveButton>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            States
          </Typography>
          <Grid container spacing={2}>
            <Grid item>
              <OliveButton loading={loading} onClick={handleLoadingTest}>
                {loading ? 'Loading...' : 'Click to Load'}
              </OliveButton>
            </Grid>
            <Grid item>
              <OliveButton disabled>Disabled</OliveButton>
            </Grid>
            <Grid item>
              <OliveButton variant="outlined" disabled>
                Disabled Outlined
              </OliveButton>
            </Grid>
          </Grid>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Full Width
          </Typography>
          <OliveButton fullWidth startIcon={<AddIcon />}>
            Full Width Button
          </OliveButton>
        </Box>
      </Paper>

      {/* Inputs */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#95A37F', mb: 3 }}>
          OliveInput
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <OliveInput
              fullWidth
              label="Outlined Input"
              placeholder="Enter text..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <OliveInput
              fullWidth
              variant="filled"
              label="Filled Input"
              placeholder="Enter text..."
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <OliveInput
              fullWidth
              label="With Helper Text"
              helperText="This is helper text"
              placeholder="Enter text..."
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <OliveInput
              fullWidth
              label="Required Field"
              required
              error
              helperText="This field is required"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <OliveInput fullWidth label="Disabled Input" disabled value="Disabled text" />
          </Grid>
          <Grid item xs={12} md={6}>
            <OliveInput
              fullWidth
              type="password"
              label="Password Input"
              placeholder="Enter password..."
            />
          </Grid>
          <Grid item xs={12}>
            <OliveInput
              fullWidth
              multiline
              rows={4}
              label="Multiline Input"
              placeholder="Enter multiple lines..."
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Badges */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#95A37F', mb: 3 }}>
          OliveBadge
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Variants
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <OliveBadge label="Filled Badge" variant="filled" />
            <OliveBadge label="Outlined Badge" variant="outlined" />
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Sizes
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <OliveBadge label="Small" size="small" />
            <OliveBadge label="Medium" size="medium" />
            <OliveBadge label="Large" size="large" />
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Status Colors
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <OliveBadge label="Success" status="success" icon={<CheckIcon />} />
            <OliveBadge label="Warning" status="warning" icon={<WarningIcon />} />
            <OliveBadge label="Error" status="error" icon={<ErrorIcon />} />
            <OliveBadge label="Info" status="info" icon={<InfoIcon />} />
            <OliveBadge label="Pending" status="pending" />
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            With Icons
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <OliveBadge label="Verified" icon={<CheckIcon />} />
            <OliveBadge label="Download" variant="outlined" icon={<DownloadIcon />} />
            <OliveBadge label="Alert" status="warning" icon={<WarningIcon />} />
          </Box>
        </Box>
      </Paper>

      {/* Loaders */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#95A37F', mb: 3 }}>
          OliveLoader
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Circular Loaders
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 2 }}>
              <OliveLoader variant="circular" size="small" />
              <OliveLoader variant="circular" size="medium" />
              <OliveLoader variant="circular" size="large" />
            </Box>
            <OliveLoader variant="circular" message="Loading..." />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Linear Loaders
            </Typography>
            <Box sx={{ mb: 3 }}>
              <OliveLoader variant="linear" />
            </Box>
            <Box sx={{ mb: 3 }}>
              <OliveLoader variant="linear" progress={45} />
            </Box>
            <OliveLoader variant="linear" message="Processing..." />
          </Grid>
        </Grid>
      </Paper>

      {/* Error Boundary */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#95A37F', mb: 3 }}>
          OliveErrorBoundary
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          The Error Boundary catches errors in child components and displays a fallback UI. Click
          the button below to test it.
        </Typography>

        <OliveErrorBoundary>
          <Box sx={{ p: 2, bgcolor: '#e8f0e0', borderRadius: 1, mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#636b2f', mb: 2 }}>
              This content is wrapped in an Error Boundary. It's working fine!
            </Typography>
          </Box>
        </OliveErrorBoundary>

        <Box sx={{ p: 2, border: '2px dashed #95A37F', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
            Test Error Boundary:
          </Typography>
          <OliveErrorBoundary>
            <OliveButton
              variant="outlined"
              onClick={() => {
                throw new Error('Test error from button click!')
              }}
            >
              Click to Trigger Error
            </OliveButton>
          </OliveErrorBoundary>
        </Box>
      </Paper>

      {/* Usage Example */}
      <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#e8f0e0', border: '2px solid #95A37F' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#636b2f', mb: 2 }}>
          💡 Usage Example
        </Typography>
        <Box
          component="pre"
          sx={{
            p: 2,
            bgcolor: 'white',
            borderRadius: 1,
            overflow: 'auto',
            fontSize: '0.875rem',
            fontFamily: 'monospace',
          }}
        >
          {`import {
  OliveButton,
  OliveInput,
  OliveBadge,
  OliveLoader,
  OliveErrorBoundary
} from '@/components/common'

// Wrap your app or components
<OliveErrorBoundary>
  <OliveButton variant="filled" size="medium" loading={loading}>
    Submit
  </OliveButton>
  
  <OliveInput 
    label="Name" 
    placeholder="Enter name..." 
  />
  
  <OliveBadge 
    label="Active" 
    status="success" 
  />
  
  <OliveLoader 
    variant="circular" 
    message="Loading..." 
  />
</OliveErrorBoundary>`}
        </Box>
      </Paper>
    </Container>
  )
}
