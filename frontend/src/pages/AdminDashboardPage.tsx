import { useState } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Checkbox,
  IconButton,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  Avatar,
  Badge,
  Divider,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
  Visibility as ViewIcon,
  School as SchoolIcon,
  DirectionsBus as BusIcon,
  ContactMail as MemoIcon,
  Description as CertificateIcon,
} from '@mui/icons-material'

interface Request {
  id: string
  studentName: string
  studentId: string
  type: 'certificate' | 'bus-pass' | 'memo-card'
  category?: string
  submittedDate: string
  sla: number // hours remaining
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'under-review'
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

// Mock data
const mockRequests: Request[] = [
  {
    id: 'REQ-001',
    studentName: 'Rajesh Kumar',
    studentId: 'STU2024001',
    type: 'certificate',
    category: 'Bonafide Certificate',
    submittedDate: '2024-11-03',
    sla: 2,
    priority: 'high',
    status: 'pending',
  },
  {
    id: 'REQ-002',
    studentName: 'Priya Sharma',
    studentId: 'STU2024002',
    type: 'bus-pass',
    category: 'Monthly Pass - Route 1',
    submittedDate: '2024-11-03',
    sla: 18,
    priority: 'medium',
    status: 'pending',
  },
  {
    id: 'REQ-003',
    studentName: 'Amit Patel',
    studentId: 'STU2024003',
    type: 'memo-card',
    category: 'Semester 4',
    submittedDate: '2024-11-02',
    sla: 6,
    priority: 'high',
    status: 'under-review',
  },
  {
    id: 'REQ-004',
    studentName: 'Sneha Reddy',
    studentId: 'STU2024004',
    type: 'certificate',
    category: 'Course Completion',
    submittedDate: '2024-11-02',
    sla: 30,
    priority: 'low',
    status: 'pending',
  },
  {
    id: 'REQ-005',
    studentName: 'Vikram Singh',
    studentId: 'STU2024005',
    type: 'bus-pass',
    category: 'Monthly Pass - Route 3',
    submittedDate: '2024-11-01',
    sla: 12,
    priority: 'medium',
    status: 'pending',
  },
]

const getRequestTypeIcon = (type: string) => {
  switch (type) {
    case 'certificate':
      return <CertificateIcon />
    case 'bus-pass':
      return <BusIcon />
    case 'memo-card':
      return <MemoIcon />
    default:
      return <AssignmentIcon />
  }
}

const getSLABadge = (sla: number) => {
  if (sla <= 4) {
    return {
      label: `${sla}h remaining`,
      color: '#d32f2f',
      bgColor: '#ffebee',
      icon: <WarningIcon fontSize="small" />,
    }
  } else if (sla <= 12) {
    return {
      label: `${sla}h remaining`,
      color: '#ed6c02',
      bgColor: '#fff3e0',
      icon: <ScheduleIcon fontSize="small" />,
    }
  } else {
    return {
      label: `${sla}h remaining`,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
      icon: <CheckCircleIcon fontSize="small" />,
    }
  }
}

const getPriorityChip = (priority: string) => {
  switch (priority) {
    case 'high':
      return { label: 'High Priority', color: '#d32f2f', bgColor: '#ffebee' }
    case 'medium':
      return { label: 'Medium', color: '#ed6c02', bgColor: '#fff3e0' }
    case 'low':
      return { label: 'Low', color: '#636b2f', bgColor: '#e8f0e0' }
    default:
      return { label: priority, color: '#757575', bgColor: '#f5f5f5' }
  }
}

export default function AdminDashboardPage() {
  const [tabValue, setTabValue] = useState(0)
  const [selectedRequests, setSelectedRequests] = useState<string[]>([])
  const [requests] = useState<Request[]>(mockRequests)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
    setSelectedRequests([])
  }

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRequests(requests.map((r) => r.id))
    } else {
      setSelectedRequests([])
    }
  }

  const handleSelectRequest = (id: string) => {
    setSelectedRequests((prev) =>
      prev.includes(id) ? prev.filter((reqId) => reqId !== id) : [...prev, id]
    )
  }

  const handleBulkApprove = () => {
    alert(`Approving ${selectedRequests.length} requests: ${selectedRequests.join(', ')}`)
    setSelectedRequests([])
  }

  const handleBulkReject = () => {
    alert(`Rejecting ${selectedRequests.length} requests: ${selectedRequests.join(', ')}`)
    setSelectedRequests([])
  }

  const stats = {
    totalRequests: 234,
    pendingApproval: 45,
    approvedToday: 28,
    avgProcessingTime: 6.5,
    slaCompliance: 94,
  }

  const oliveFocusStyle = {
    '&:focus': {
      outline: '2px solid #95A37F',
      outlineOffset: 2,
    },
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#636b2f', mb: 1 }}>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage student service requests and monitor system performance
        </Typography>
      </Box>

      {/* Analytics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '2px solid #95A37F', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#95A37F', mr: 2 }}>
                  <AssignmentIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Total Requests
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#636b2f' }}>
                    {stats.totalRequests}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  bgcolor: '#e8f0e0',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <TrendingUpIcon sx={{ fontSize: 16, color: '#636b2f', mr: 0.5 }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#636b2f' }}>
                  +12% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '2px solid #ed6c02', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#ed6c02', mr: 2 }}>
                  <PendingIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Pending Approval
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#e65100' }}>
                    {stats.pendingApproval}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  bgcolor: '#fff3e0',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <WarningIcon sx={{ fontSize: 16, color: '#e65100', mr: 0.5 }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#e65100' }}>
                  Requires attention
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '2px solid #2e7d32', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#2e7d32', mr: 2 }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Approved Today
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                    {stats.approvedToday}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  bgcolor: '#e8f5e9',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 16, color: '#2e7d32', mr: 0.5 }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                  On track
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '2px solid #95A37F', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#95A37F', mr: 2 }}>
                  <ScheduleIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Avg. Processing Time
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#636b2f' }}>
                    {stats.avgProcessingTime}h
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  SLA Compliance: {stats.slaCompliance}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={stats.slaCompliance}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: '#E0E0E0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#95A37F',
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        {/* Header with Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#95A37F' }}>
              Pending Approvals
            </Typography>
            {selectedRequests.length > 0 && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  startIcon={<ApproveIcon />}
                  onClick={handleBulkApprove}
                  sx={{
                    bgcolor: '#95A37F',
                    color: 'white',
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    border: '2px solid #95A37F',
                    ...oliveFocusStyle,
                  }}
                >
                  Approve ({selectedRequests.length})
                </Button>
                <Button
                  startIcon={<RejectIcon />}
                  onClick={handleBulkReject}
                  sx={{
                    bgcolor: 'transparent',
                    color: '#d32f2f',
                    border: '2px solid #d32f2f',
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    ...oliveFocusStyle,
                  }}
                >
                  Reject ({selectedRequests.length})
                </Button>
              </Box>
            )}
          </Box>

          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                minWidth: 100,
              },
              '& .Mui-selected': {
                color: '#95A37F',
                fontWeight: 600,
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#95A37F',
                height: 3,
              },
            }}
          >
            <Tab label="All Requests" icon={<AssignmentIcon />} iconPosition="start" />
            <Tab label="Certificates" icon={<CertificateIcon />} iconPosition="start" />
            <Tab label="Bus Pass" icon={<BusIcon />} iconPosition="start" />
            <Tab label="Memo Card" icon={<MemoIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Alert for urgent requests */}
        {requests.filter((r) => r.sla <= 4).length > 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {requests.filter((r) => r.sla <= 4).length} request(s) are approaching SLA deadline!
            </Typography>
          </Alert>
        )}

        {/* Requests Table */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#e8f0e0' }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRequests.length === requests.length && requests.length > 0}
                      indeterminate={
                        selectedRequests.length > 0 && selectedRequests.length < requests.length
                      }
                      onChange={handleSelectAll}
                      sx={{
                        color: '#95A37F',
                        '&.Mui-checked': {
                          color: '#95A37F',
                        },
                        '&.MuiCheckbox-indeterminate': {
                          color: '#95A37F',
                        },
                        ...oliveFocusStyle,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#636b2f' }}>Request ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#636b2f' }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#636b2f' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#636b2f' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#636b2f' }}>Submitted</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#636b2f' }}>SLA Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#636b2f' }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#636b2f' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((request) => {
                  const isSelected = selectedRequests.includes(request.id)
                  const slaBadge = getSLABadge(request.sla)
                  const priorityChip = getPriorityChip(request.priority)

                  return (
                    <TableRow
                      key={request.id}
                      sx={{
                        bgcolor: isSelected ? '#e8f0e0' : 'transparent',
                        '&:last-child td, &:last-child th': { border: 0 },
                        borderLeft: request.sla <= 4 ? '4px solid #d32f2f' : 'none',
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelectRequest(request.id)}
                          sx={{
                            color: '#95A37F',
                            '&.Mui-checked': {
                              color: '#95A37F',
                            },
                            ...oliveFocusStyle,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#636b2f' }}>
                          {request.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {request.studentName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.studentId}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getRequestTypeIcon(request.type)}
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {request.type.replace('-', ' ')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{request.category}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{request.submittedDate}</Typography>
                      </TableCell>
                      <TableCell>
                        <Badge
                          badgeContent={
                            <Box
                              sx={{
                                bgcolor: slaBadge.color,
                                color: 'white',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                              }}
                            >
                              {slaBadge.icon}
                              {slaBadge.label}
                            </Box>
                          }
                          sx={{
                            '& .MuiBadge-badge': {
                              position: 'static',
                              transform: 'none',
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={priorityChip.label}
                          size="small"
                          sx={{
                            bgcolor: priorityChip.bgColor,
                            color: priorityChip.color,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            border: `1.5px solid ${priorityChip.color}`,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            sx={{
                              color: '#95A37F',
                              border: '1px solid #95A37F',
                              ...oliveFocusStyle,
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            sx={{
                              color: '#2e7d32',
                              border: '1px solid #2e7d32',
                              ...oliveFocusStyle,
                            }}
                          >
                            <ApproveIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            sx={{
                              color: '#d32f2f',
                              border: '1px solid #d32f2f',
                              ...oliveFocusStyle,
                            }}
                          >
                            <RejectIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Filtered views for other tabs */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="body2" color="text.secondary">
            Showing only Certificate requests...
          </Typography>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Typography variant="body2" color="text.secondary">
            Showing only Bus Pass requests...
          </Typography>
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <Typography variant="body2" color="text.secondary">
            Showing only Memo Card requests...
          </Typography>
        </TabPanel>
      </Paper>
    </Container>
  )
}
