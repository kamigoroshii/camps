import { Container, Typography, Paper } from '@mui/material'
import { Settings as SettingsIcon } from '@mui/icons-material'

export default function AdminSettingsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <SettingsIcon sx={{ fontSize: 80, color: '#d32f2f', mb: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#d32f2f', mb: 2 }}>
          System Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This page is under construction. System configuration features will be available here.
        </Typography>
      </Paper>
    </Container>
  )
}
