import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
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
  Tooltip,
  ListItemAvatar,
  Collapse,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  CardGiftcard as ScholarshipIcon,
  Assignment as CamsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Description as CertificateIcon,
  DirectionsBus as BusIcon,
  ContactMail as MemoIcon,
  History as HistoryIcon,
  Chat as ChatIcon,
  VerifiedUser as VerificationIcon,
} from '@mui/icons-material'
import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { palette, gradients } from '../theme'

const DRAWER_WIDTH = 280
const DRAWER_WIDTH_COLLAPSED = 70

interface SubNavItem {
  title: string
  path: string
  icon: React.ReactNode
}

interface NavItem {
  title: string
  path: string
  icon: React.ReactNode
  subItems?: SubNavItem[]
}

const navigationItems: NavItem[] = [
  { title: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { 
    title: 'Student Service Center', 
    path: '/student-services', 
    icon: <SchoolIcon />,
    subItems: [
      { title: 'Create Request', path: '/requests/new', icon: <CertificateIcon /> },
      { title: 'My Requests', path: '/requests', icon: <DashboardIcon /> },
      { title: 'Certificate Requests', path: '/student-services/certificates', icon: <CertificateIcon /> },
      { title: 'Bus Pass', path: '/student-services/bus-pass', icon: <BusIcon /> },
      { title: 'Memo Card', path: '/student-services/memo-card', icon: <MemoIcon /> },
      { title: 'Request History', path: '/requests/history', icon: <HistoryIcon /> },
    ]
  },
  { 
    title: 'Scholarship Portal', 
    path: '/scholarship', 
    icon: <ScholarshipIcon />,
    subItems: [
      { title: 'Unified Scholarship Portal', path: '/scholarship', icon: <ScholarshipIcon /> },
    ]
  },
  { title: 'CAMS Department', path: '/cams', icon: <CamsIcon /> },
  { title: 'Chat', path: '/chat', icon: <ChatIcon /> },
  { title: 'Notifications', path: '/notifications', icon: <NotificationsIcon /> },
  { title: 'Admin Dashboard', path: '/admin', icon: <SettingsIcon /> },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [notificationCount] = useState(5) // Mock notification count
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  // Check if user is admin
  const isAdmin = user?.role?.toLowerCase() === 'admin'

  // Filter navigation items based on user role
  const visibleNavigationItems = navigationItems.filter(item => {
    if (item.title === 'Admin Dashboard') {
      return isAdmin
    }
    return true
  })

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

  const handleExpandToggle = (itemTitle: string) => {
    setExpandedItems(prev => 
      prev.includes(itemTitle) 
        ? prev.filter(item => item !== itemTitle)
        : [...prev, itemTitle]
    )
  }

  const isActive = (path: string) => location.pathname === path

  const getInitials = (name?: string) => {
    if (!name) return 'U'
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
        bgcolor: palette.primary, // #95A37F olive green
        color: palette.white,
      }}
    >
      {/* Sidebar Header with Collapse Button */}
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
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  bgcolor: palette.white,
                  color: palette.primary,
                  width: 36,
                  height: 36,
                  fontWeight: 700,
                  fontSize: '0.875rem',
                }}
              >
                CP
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700, color: palette.white, fontSize: '1.1rem' }}>
                Campus Portal
              </Typography>
            </Box>
            {/* Collapse Button - Desktop Only */}
            {!isMobile && (
              <IconButton
                onClick={handleSidebarToggle}
                sx={{
                  color: palette.white,
                  border: `1px solid rgba(255, 255, 255, 0.2)`,
                  borderRadius: 2,
                  p: 0.5,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
            )}
          </>
        )}
        
        {collapsed && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                bgcolor: palette.white,
                color: palette.primary,
                width: 36,
                height: 36,
                fontWeight: 700,
                fontSize: '0.875rem',
              }}
            >
              CP
            </Avatar>
            {/* Collapse Button - Desktop Only */}
            {!isMobile && (
              <IconButton
                onClick={handleSidebarToggle}
                sx={{
                  color: palette.white,
                  border: `1px solid rgba(255, 255, 255, 0.2)`,
                  borderRadius: 2,
                  p: 0.5,
                  mt: 0.5,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ChevronRightIcon />
              </IconButton>
            )}
          </Box>
        )}
      </Box>

      {/* Main Navigation */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', py: 2 }}>
        <List sx={{ px: collapsed ? 0.5 : 1 }}>
          {visibleNavigationItems.map((item) => {
            const active = isActive(item.path)
            const isExpanded = expandedItems.includes(item.title)
            const hasSubItems = item.subItems && item.subItems.length > 0
            
            return (
              <Box key={item.path}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <Tooltip title={collapsed ? item.title : ''} placement="right" arrow>
                    <ListItemButton
                      onClick={() => {
                        if (hasSubItems && !collapsed) {
                          handleExpandToggle(item.title)
                        } else {
                          handleNavigation(item.path)
                        }
                      }}
                      sx={{
                        mx: collapsed ? 0.5 : 1,
                        borderRadius: 2,
                        minHeight: 48,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        px: collapsed ? 1 : 2,
                        bgcolor: active ? palette.primaryLight : 'transparent',
                        color: palette.white,
                        transition: 'none',
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
                        <>
                          <ListItemText
                            primary={item.title}
                            primaryTypographyProps={{
                              fontWeight: active ? 700 : 500,
                              fontSize: '0.95rem',
                            }}
                          />
                          {hasSubItems && (
                            isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />
                          )}
                          {item.path === '/notifications' && notificationCount > 0 && (
                            <Badge 
                              badgeContent={notificationCount} 
                              color="error"
                              sx={{
                                '& .MuiBadge-badge': {
                                  fontWeight: 600,
                                },
                              }}
                            />
                          )}
                        </>
                      )}
                      {collapsed && item.path === '/notifications' && notificationCount > 0 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: palette.error,
                          }}
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>

                {/* Sub-menu items */}
                {hasSubItems && !collapsed && (
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.subItems!.map((subItem) => {
                        const subActive = isActive(subItem.path)
                        return (
                          <ListItem key={subItem.path} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                              onClick={() => handleNavigation(subItem.path)}
                              sx={{
                                mx: 1,
                                ml: 3,
                                borderRadius: 2,
                                minHeight: 40,
                                px: 2,
                                bgcolor: subActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                                color: palette.white,
                                transition: 'none',
                                '& .MuiListItemIcon-root': {
                                  color: palette.white,
                                },
                              }}
                            >
                              <ListItemIcon
                                sx={{
                                  minWidth: 36,
                                  color: palette.white,
                                  fontSize: '1rem',
                                }}
                              >
                                {subItem.icon}
                              </ListItemIcon>
                              <ListItemText
                                primary={subItem.title}
                                primaryTypographyProps={{
                                  fontWeight: subActive ? 600 : 400,
                                  fontSize: '0.875rem',
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                        )
                      })}
                    </List>
                  </Collapse>
                )}
              </Box>
            )
          })}
        </List>
      </Box>

      {/* Profile Section - Bottom */}
      <Box 
        sx={{ 
          p: 1,
          borderTop: `1px solid rgba(255, 255, 255, 0.1)`,
        }}
      >
        <Tooltip title={collapsed ? 'Profile' : ''} placement="right" arrow>
          <ListItemButton
            onClick={() => handleNavigation('/profile')}
            sx={{
              mx: collapsed ? 0.5 : 1,
              borderRadius: 2,
              minHeight: 48,
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 1 : 2,
              bgcolor: isActive('/profile') ? palette.primaryLight : 'transparent',
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
              <PersonIcon />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Profile"
                primaryTypographyProps={{
                  fontWeight: isActive('/profile') ? 700 : 500,
                  fontSize: '0.95rem',
                }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </Box>
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
          transition: 'width 0.3s ease',
        }}
        aria-label="navigation"
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
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
              transition: 'width 0.3s ease',
            },
          }}
          open
        >
          {drawerContent(sidebarCollapsed)}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s ease',
        }}
      >
        {/* Top Navbar - Collapsible */}
        <AppBar
          position="sticky"
          elevation={1}
          sx={{
            background: gradients.primary,
            color: palette.white,
            borderBottom: 'none',
          }}
        >
          <Toolbar 
            sx={{ 
              justifyContent: 'space-between',
              minHeight: { xs: 60, sm: 70 },
              height: { xs: 60, sm: 70 },
            }}
          >
            {/* Left Side - Mobile Menu + Page Title */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Mobile Menu Button */}
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ 
                  display: { md: 'none' },
                  color: palette.white,
                }}
              >
                <MenuIcon />
              </IconButton>

              {/* Page Title */}
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: palette.white,
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                }}
              >
                {navigationItems.find((item) => isActive(item.path))?.title || 'Campus Portal'}
              </Typography>
            </Box>

            {/* Right Side - Notifications + User Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Notification Bell */}
              <Tooltip title="Notifications">
                <IconButton
                  onClick={() => handleNavigation('/notifications')}
                  sx={{
                    color: palette.white,
                  }}
                >
                  <Badge badgeContent={notificationCount} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* User Avatar Dropdown */}
              <Tooltip title="Account settings">
                <IconButton
                  onClick={handleMenu}
                  sx={{
                    p: 0.5,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: palette.white,
                      color: palette.primary,
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    {getInitials(user?.full_name)}
                  </Avatar>
                </IconButton>
              </Tooltip>

              {/* User Dropdown Menu */}
              <Menu
                id="user-menu"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                sx={{
                  mt: 1.5,
                  '& .MuiPaper-root': {
                    minWidth: 240,
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  },
                }}
              >
                {/* User Info Header */}
                <MenuItem 
                  disabled 
                  sx={{ 
                    opacity: 1, 
                    cursor: 'default',
                    '&.Mui-disabled': {
                      opacity: 1,
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: palette.primary,
                        color: palette.white,
                        fontWeight: 600,
                      }}
                    >
                      {getInitials(user?.full_name)}
                    </Avatar>
                  </ListItemAvatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: palette.textPrimary }}>
                      {user?.full_name || 'Guest User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user?.email || 'guest@example.com'}
                    </Typography>
                  </Box>
                </MenuItem>
                
                <Divider sx={{ my: 1 }} />

                {/* Profile */}
                <MenuItem
                  onClick={() => {
                    handleClose()
                    handleNavigation('/profile')
                  }}
                >
                  <ListItemIcon>
                    <PersonIcon fontSize="small" sx={{ color: palette.primary }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Profile" 
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </MenuItem>

                {/* Settings */}
                <MenuItem
                  onClick={() => {
                    handleClose()
                    // Navigate to settings when page is created
                    console.log('Settings clicked')
                  }}
                >
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" sx={{ color: palette.primary }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Settings" 
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </MenuItem>

                <Divider sx={{ my: 1 }} />

                {/* Logout */}
                <MenuItem
                  onClick={handleLogout}
                  sx={{
                    color: palette.error,
                  }}
                >
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" sx={{ color: palette.error }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Logout" 
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 4 },
            bgcolor: 'background.default',
          }}
        >
          <Outlet />
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 2.5,
            px: 3,
            mt: 'auto',
            bgcolor: palette.backgroundSubtle,
            borderTop: `1px solid ${palette.borderLight}`,
          }}
        >
          <Typography variant="body2" color="text.secondary" align="center" sx={{ fontSize: '0.875rem' }}>
            © {new Date().getFullYear()} Campus Portal. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
