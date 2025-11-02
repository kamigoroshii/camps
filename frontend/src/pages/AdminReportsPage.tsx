import { Container, Typography, Paper } from '@mui/material'
import { Assessment as ReportsIcon } from '@mui/icons-material'

export default function AdminReportsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <ReportsIcon sx={{ fontSize: 80, color: '#d32f2f', mb: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#d32f2f', mb: 2 }}>
          Reports & Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This page is under construction. Reporting and analytics features will be available here.
        </Typography>
      </Paper>
    </Container>
  )
}
