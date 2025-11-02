import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Avatar,
  Pagination,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  FilterList as FilterListIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material'
import { palette } from '../theme'

interface Request {
  id: number
  title: string
  type: string
  status: 'pending' | 'approved' | 'rejected' | 'needs_action' | 'in_progress'
  date: string
  lastUpdated: string
  description: string
}

const mockRequests: Request[] = [
  {
    id: 1,
    title: 'Course Registration Request',
    type: 'Course Registration',
    status: 'in_progress',
    date: '2024-10-28',
    lastUpdated: '2 days ago',
    description: 'Request to register for advanced mathematics course',
  },
  {
    id: 2,
    title: 'Grade Appeal Form',
    type: 'Grade Appeal',
    status: 'pending',
    date: '2024-10-25',
    lastUpdated: '5 days ago',
    description: 'Appeal for mid-term examination grade review',
  },
  {
    id: 3,
    title: 'Transcript Request',
    type: 'Document Request',
    status: 'approved',
    date: '2024-10-20',
    lastUpdated: '1 week ago',
    description: 'Official transcript for job application',
  },
  {
    id: 4,
    title: 'Leave of Absence',
    type: 'Leave Request',
    status: 'pending',
    date: '2024-10-23',
    lastUpdated: '1 week ago',
    description: 'Medical leave request for 2 weeks',
  },
  {
    id: 5,
    title: 'Scholarship Application',
    type: 'Financial Aid',
    status: 'needs_action',
    date: '2024-10-18',
    lastUpdated: '12 days ago',
    description: 'Merit-based scholarship application',
  },
  {
    id: 6,
    title: 'Course Drop Request',
    type: 'Course Registration',
    status: 'rejected',
    date: '2024-10-15',
    lastUpdated: '2 weeks ago',
    description: 'Request to drop Physics 101 course',
  },
  {
    id: 7,
    title: 'Internship Credit Approval',
    type: 'Academic Credit',
    status: 'approved',
    date: '2024-10-12',
    lastUpdated: '2 weeks ago',
    description: 'Credit approval for summer internship',
  },
  {
    id: 8,
    title: 'Extension Request',
    type: 'Academic',
    status: 'needs_action',
    date: '2024-10-10',
    lastUpdated: '3 weeks ago',
    description: 'Extension for final project submission',
  },
]

const requestTypes = ['All Types', 'Course Registration', 'Grade Appeal', 'Document Request', 'Leave Request', 'Financial Aid', 'Academic Credit', 'Academic']
const statusFilters = ['All Status', 'pending', 'approved', 'rejected', 'needs_action', 'in_progress']

const ITEMS_PER_PAGE = 6

export default function RequestsPage() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest')
  const [page, setPage] = useState(1)
  const [selectedRow, setSelectedRow] = useState<number | null>(null)

  const getStatusColor = (status: string): { color: string; bgcolor: string; label: string } => {
    switch (status) {
      case 'approved':
        return { color: palette.success, bgcolor: `${palette.success}15`, label: 'Approved' }
      case 'pending':
        return { color: palette.warning, bgcolor: `${palette.warning}15`, label: 'Pending' }
      case 'needs_action':
        return { color: palette.error, bgcolor: `${palette.error}15`, label: 'Needs Action' }
      case 'rejected':
        return { color: palette.error, bgcolor: `${palette.error}15`, label: 'Rejected' }
      case 'in_progress':
        return { color: palette.info, bgcolor: `${palette.info}15`, label: 'In Progress' }
      default:
        return { color: palette.textSecondary, bgcolor: `${palette.textSecondary}15`, label: status }
    }
  }

  const filteredRequests = mockRequests
    .filter((req) => {
      const matchesSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = typeFilter === 'All Types' || req.type === typeFilter
      const matchesStatus = statusFilter === 'All Status' || req.status === statusFilter
      return matchesSearch && matchesType && matchesStatus
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateSort === 'newest' ? dateB - dateA : dateA - dateB
    })

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE)
  const paginatedRequests = filteredRequests.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const handleViewRequest = (id: number) => {
    navigate(`/requests/${id}`)
  }

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
    setSelectedRow(null)
  }

  const renderTableView = () => (
    <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${palette.borderLight}` }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, bgcolor: palette.primary, color: palette.white }}>
              Request
            </TableCell>
            <TableCell sx={{ fontWeight: 700, bgcolor: palette.primary, color: palette.white }}>
              Type
            </TableCell>
            <TableCell sx={{ fontWeight: 700, bgcolor: palette.primary, color: palette.white }}>
              Status
            </TableCell>
            <TableCell sx={{ fontWeight: 700, bgcolor: palette.primary, color: palette.white }}>
              Date
            </TableCell>
            <TableCell sx={{ fontWeight: 700, bgcolor: palette.primary, color: palette.white }}>
              Last Updated
            </TableCell>
            <TableCell sx={{ fontWeight: 700, bgcolor: palette.primary, color: palette.white }} align="right">
              Action
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedRequests.map((request) => {
            const statusInfo = getStatusColor(request.status)
            const isSelected = selectedRow === request.id
            return (
              <TableRow
                key={request.id}
                onClick={() => {
                  setSelectedRow(request.id)
                  handleViewRequest(request.id)
                }}
                sx={{
                  cursor: 'pointer',
                  bgcolor: isSelected ? `${palette.primary}08` : 'transparent',
                  border: isSelected ? `2px solid ${palette.primary}` : 'none',
                  '& td': {
                    borderBottom: `1px solid ${palette.borderLight}`,
                  },
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      sx={{
                        bgcolor: `${palette.primary}20`,
                        color: palette.primary,
                        width: 40,
                        height: 40,
                      }}
                    >
                      <AssignmentIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {request.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        #{request.id}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{request.type}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={statusInfo.label}
                    size="small"
                    sx={{
                      bgcolor: statusInfo.bgcolor,
                      color: statusInfo.color,
                      fontWeight: 600,
                      borderRadius: 1.5,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{new Date(request.date).toLocaleDateString()}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {request.lastUpdated}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewRequest(request.id)
                    }}
                    sx={{
                      color: palette.primary,
                    }}
                  >
                    <ArrowForwardIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )

  const renderGridView = () => (
    <Grid container spacing={3}>
      {paginatedRequests.map((request) => {
        const statusInfo = getStatusColor(request.status)
        const isSelected = selectedRow === request.id
        return (
          <Grid item xs={12} sm={6} md={4} key={request.id}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                cursor: 'pointer',
                border: isSelected ? `2px solid ${palette.primary}` : `1px solid ${palette.borderLight}`,
                bgcolor: isSelected ? `${palette.primary}08` : 'transparent',
              }}
              onClick={() => {
                setSelectedRow(request.id)
                handleViewRequest(request.id)
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: `${palette.primary}20`,
                      color: palette.primary,
                      width: 48,
                      height: 48,
                    }}
                  >
                    <AssignmentIcon />
                  </Avatar>
                  <Chip
                    label={statusInfo.label}
                    size="small"
                    sx={{
                      bgcolor: statusInfo.bgcolor,
                      color: statusInfo.color,
                      fontWeight: 600,
                      borderRadius: 1.5,
                    }}
                  />
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }} noWrap>
                  {request.title}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  {request.description}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {request.type}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(request.date).toLocaleDateString()} • {request.lastUpdated}
                    </Typography>
                  </Box>
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    mt: 2,
                    borderColor: palette.primary,
                    color: palette.primary,
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewRequest(request.id)
                  }}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )
      })}
    </Grid>
  )

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: palette.darkBrown }}>
            My Requests
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage all your submitted requests
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/requests/new')}
          sx={{
            bgcolor: palette.primary,
            color: palette.white,
            fontWeight: 600,
          }}
        >
          New Request
        </Button>
      </Box>

      {/* Filters Bar */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: `1px solid ${palette.borderLight}` }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Type Filter */}
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              fullWidth
              select
              size="small"
              label="Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {requestTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Status Filter */}
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              fullWidth
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusFilters.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Date Sort */}
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              select
              size="small"
              label="Sort by Date"
              value={dateSort}
              onChange={(e) => setDateSort(e.target.value as 'newest' | 'oldest')}
            >
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="oldest">Oldest First</MenuItem>
            </TextField>
          </Grid>

          {/* View Toggle */}
          <Grid item xs={12} sm={6} md={1}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_e, newView) => newView && setViewMode(newView)}
              size="small"
              fullWidth
            >
              <ToggleButton value="table">
                <Tooltip title="Table View">
                  <ViewListIcon />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="grid">
                <Tooltip title="Grid View">
                  <ViewModuleIcon />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>

        {/* Active Filters Summary */}
        {(searchQuery || typeFilter !== 'All Types' || statusFilter !== 'All Status') && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <FilterListIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Active Filters:
            </Typography>
            {searchQuery && (
              <Chip
                label={`Search: "${searchQuery}"`}
                size="small"
                onDelete={() => setSearchQuery('')}
                sx={{ bgcolor: palette.oliveGreenLight, color: palette.darkBrown }}
              />
            )}
            {typeFilter !== 'All Types' && (
              <Chip
                label={`Type: ${typeFilter}`}
                size="small"
                onDelete={() => setTypeFilter('All Types')}
                sx={{ bgcolor: palette.oliveGreenLight, color: palette.darkBrown }}
              />
            )}
            {statusFilter !== 'All Status' && (
              <Chip
                label={`Status: ${statusFilter}`}
                size="small"
                onDelete={() => setStatusFilter('All Status')}
                sx={{ bgcolor: palette.oliveGreenLight, color: palette.darkBrown }}
              />
            )}
          </Box>
        )}
      </Paper>

      {/* Results Count */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, filteredRequests.length)} of {filteredRequests.length} requests
        </Typography>
      </Box>

      {/* Content */}
      {filteredRequests.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', border: `1px solid ${palette.borderLight}` }}>
          <AssignmentIcon sx={{ fontSize: 80, color: palette.textSecondary, mb: 2, opacity: 0.3 }} />
          <Typography variant="h6" gutterBottom color="text.secondary">
            No requests found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Try adjusting your filters or create a new request
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/requests/new')}
            sx={{
              bgcolor: palette.primary,
              color: palette.white,
            }}
          >
            Create New Request
          </Button>
        </Paper>
      ) : (
        <>
          {viewMode === 'table' ? renderTableView() : renderGridView()}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange}
                color="primary"
                size="large"
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: palette.textPrimary,
                  },
                  '& .MuiPaginationItem-root.Mui-selected': {
                    bgcolor: palette.primary,
                    color: palette.white,
                  },
                }}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  )
}
