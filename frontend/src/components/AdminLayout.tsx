import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  Dashboard as DashboardIcon,
  Assignment as RequestsIcon,
  People as UsersIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material'
import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { palette } from '../theme'

const DRAWER_WIDTH = 280
const DRAWER_WIDTH_COLLAPSED = 70

interface NavItem {
  title: string
  path: string
  icon: React.ReactNode
}

import { Chat as ChatIcon, VerifiedUser as VerificationIcon, ContactMail as MemoCardIcon, DirectionsBus as BusPassIcon } from '@mui/icons-material'

const adminNavigationItems: NavItem[] = [
  { title: 'Dashboard', path: '/admin', icon: <DashboardIcon /> },
  { title: 'Manage Requests', path: '/admin/requests', icon: <RequestsIcon /> },
  { title: 'Scholarship Review', path: '/admin/scholarship-review', icon: <VerificationIcon /> },
  { title: 'Bus Pass Review', path: '/admin/bus-pass-review', icon: <BusPassIcon /> },
  { title: 'Memo Card Review', path: '/admin/memo-card-review', icon: <MemoCardIcon /> },
  { title: 'User Management', path: '/admin/users', icon: <UsersIcon /> },
  { title: 'Reports & Analytics', path: '/admin/reports', icon: <ReportsIcon /> },
  { title: 'System Settings', path: '/admin/settings', icon: <SettingsIcon /> },
  { title: 'Chat', path: '/admin/chat', icon: <ChatIcon /> },
]

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const currentDrawerWidth = sidebarCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  const getInitials = (name?: string) => {
    if (!name) return 'A'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const drawerContent = (collapsed: boolean) => (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#0891b2', // Ocean teal/cyan theme
        color: palette.white,
      }}
    >
      {/* Sidebar Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 64,
          borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
        }}
      >
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src="/assets/logo.jpg"
              alt="Campus Logo"
              sx={{
                width: 50,
                height: 50,
                objectFit: 'contain',
              }}
            />
            <Typography variant="h6" sx={{ fontWeight: 700, color: palette.white, fontSize: '1.15rem' }}>
              Admin Panel
            </Typography>
          </Box>
        )}
        
        {collapsed && (
          <Box
            component="img"
            src="/assets/logo.jpg"
            alt="Campus Logo"
            sx={{
              width: 45,
              height: 45,
              objectFit: 'contain',
            }}
          />
        )}
      </Box>

      {/* Admin Profile Section */}
      {!collapsed && (
        <Box 
          sx={{ 
            p: 2, 
            bgcolor: 'rgba(0, 0, 0, 0.2)',
            borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: '#0e7490',
                color: palette.white,
                width: 48,
                height: 48,
                fontWeight: 600,
                fontSize: '1.1rem',
              }}
            >
              {getInitials(user?.full_name)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600, 
                  color: palette.white,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.95rem',
                }}
              >
                {user?.full_name || 'Administrator'}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  display: 'block',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.75rem',
                }}
              >
                {user?.role || 'Admin'}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {collapsed && (
        <Box 
          sx={{ 
            p: 1.5,
            display: 'flex',
            justifyContent: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.2)',
            borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
          }}
        >
          <Avatar
            sx={{
              bgcolor: '#0e7490',
              color: palette.white,
              width: 40,
              height: 40,
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            {getInitials(user?.full_name)}
          </Avatar>
        </Box>
      )}

      {/* Main Navigation */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', py: 2 }}>
        <List sx={{ px: collapsed ? 0.5 : 1 }}>
          {adminNavigationItems.map((item) => {
            const active = isActive(item.path)
            
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    mx: collapsed ? 0.5 : 1,
                    borderRadius: 2,
                    minHeight: 48,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    px: collapsed ? 1 : 2,
                    bgcolor: active ? 'rgba(0, 0, 0, 0.2)' : 'transparent',
                    color: palette.white,
                    '& .MuiListItemIcon-root': {
                      color: palette.white,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: collapsed ? 'auto' : 40,
                      color: palette.white,
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{
                        fontWeight: active ? 700 : 500,
                        fontSize: '1rem',
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      </Box>

      {/* Collapse Toggle Button - Desktop Only */}
      {!isMobile && (
        <Box 
          sx={{ 
            p: 1,
            borderTop: `1px solid rgba(255, 255, 255, 0.1)`,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <IconButton
            onClick={handleSidebarToggle}
            sx={{
              color: palette.white,
              border: `1px solid rgba(255, 255, 255, 0.2)`,
              borderRadius: 2,
            }}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
      )}
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{
          width: { md: currentDrawerWidth },
          flexShrink: { md: 0 },
        }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              border: 'none',
            },
          }}
        >
          {drawerContent(false)}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: currentDrawerWidth,
              border: 'none',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
          open
        >
          {drawerContent(sidebarCollapsed)}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'white',
            color: 'text.primary',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ flexGrow: 1 }} />

            {/* Admin Profile Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0891b2' }}>
                Admin Portal
              </Typography>
              <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                <Avatar
                  sx={{
                    bgcolor: '#0891b2',
                    width: 40,
                    height: 40,
                    fontWeight: 600,
                  }}
                >
                  {getInitials(user?.full_name)}
                </Avatar>
              </IconButton>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => { handleClose(); navigate('/admin/profile') }}>
                <PersonIcon sx={{ mr: 2 }} /> Profile
              </MenuItem>
              <MenuItem onClick={() => { handleClose(); navigate('/admin/settings') }}>
                <SettingsIcon sx={{ mr: 2 }} /> Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 2, color: '#0891b2' }} /> 
                <Typography sx={{ color: '#0891b2', fontWeight: 600 }}>Logout</Typography>
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
