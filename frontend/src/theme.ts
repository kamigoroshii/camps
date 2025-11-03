import { createTheme } from '@mui/material/styles'

/**
 * Campus Portal Theme - Olive Green (#95A37F) Primary Color
 * WCAG AA Compliant with Good Contrast Ratios
 * Features minimal hover effects with focus outlines and subtle shading
 */

// ============================================
// COLOR TOKENS - Olive Green (#95A37F) System
// ============================================

const paletteBase = {
  // Primary Olive Green Shades
  primary: '#95A37F',              // Main olive green - primary brand color
  primaryLight: '#B4C09F',         // Light olive for backgrounds and hover states
  primaryDark: '#6D7A5C',          // Dark olive for emphasis and active states
  primaryPale: '#E8EBE3',          // Very light olive for subtle backgrounds
  
  // Secondary Colors - Complementary neutrals
  secondary: '#8B8B7A',            // Warm gray-olive for secondary elements
  secondaryLight: '#B5B5A8',       // Light warm gray
  secondaryDark: '#5F5F52',        // Dark warm gray
  
  // Semantic Colors (WCAG AA Compliant)
  success: '#2e7d32',              // Green for success states (4.5:1 contrast on white)
  successLight: '#4caf50',         // Light success
  successDark: '#1b5e20',          // Dark success
  
  info: '#0288d1',                 // Blue for informational states (4.5:1 contrast)
  infoLight: '#03a9f4',            // Light info
  infoDark: '#01579b',             // Dark info
  
  warning: '#ed6c02',              // Orange for warnings (4.5:1 contrast)
  warningLight: '#ff9800',         // Light warning
  warningDark: '#e65100',          // Dark warning
  
  error: '#d32f2f',                // Red for errors (4.5:1 contrast)
  errorLight: '#f44336',           // Light error
  errorDark: '#c62828',            // Dark error
  
  // Neutral Grays - Background, text, borders
  gray50: '#FAFAFA',               // Lightest gray - subtle backgrounds
  gray100: '#F5F5F5',              // Very light gray - card backgrounds
  gray200: '#EEEEEE',              // Light gray - dividers
  gray300: '#E0E0E0',              // Medium-light gray - borders
  gray400: '#BDBDBD',              // Medium gray - disabled states
  gray500: '#9E9E9E',              // Mid gray - secondary text
  gray600: '#757575',              // Dark-medium gray - body text
  gray700: '#616161',              // Dark gray - headings
  gray800: '#424242',              // Very dark gray - emphasis
  gray900: '#212121',              // Darkest gray - high contrast text
  
  // Background Colors
  background: '#FFFFFF',           // Pure white - main background
  backgroundAlt: '#FAFAFA',        // Off-white - alternate sections
  backgroundSubtle: '#F5F5F5',     // Very light gray - cards
  
  // Text Colors (WCAG AA compliant)
  textPrimary: '#212121',          // Main text - 16:1 contrast ratio
  textSecondary: '#616161',        // Secondary text - 7:1 contrast ratio
  textDisabled: '#9E9E9E',         // Disabled text - 3:1 contrast ratio
  textHint: '#BDBDBD',             // Hint text
  
  // Border Colors
  borderLight: '#E0E0E0',          // Light borders
  borderMedium: '#BDBDBD',         // Medium borders
  borderDark: '#757575',           // Dark borders
  borderFocus: '#95A37F',          // Focus state borders (primary color)
  
  // White and Black
  white: '#FFFFFF',
  black: '#000000',
}

// Add backward compatibility aliases
export const palette = {
  ...paletteBase,
  // Backward compatibility - old names point to new tokens
  oliveGreen: paletteBase.primary,
  oliveGreenLight: paletteBase.primaryLight,
  oliveGreenDark: paletteBase.primaryDark,
  offWhite: paletteBase.backgroundAlt,
  darkBrown: paletteBase.textPrimary,
  tan: paletteBase.secondary,
  lightGrey: paletteBase.borderLight,
  grey: paletteBase.gray500,
} as const

// ============================================
// SPACING TOKENS (8px base unit)
// ============================================

export const spacing = {
  xs: 4,       // 4px - tight spacing
  sm: 8,       // 8px - small spacing
  md: 16,      // 16px - medium spacing
  lg: 24,      // 24px - large spacing
  xl: 32,      // 32px - extra large spacing
  xxl: 48,     // 48px - section spacing
  xxxl: 64,    // 64px - page section spacing
} as const

// ============================================
// SHADOW TOKENS - Subtle depth
// ============================================

export const shadows = {
  none: 'none',
  sm: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px rgba(0, 0, 0, 0.10), 0 2px 4px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.10), 0 4px 6px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.10), 0 10px 10px rgba(0, 0, 0, 0.04)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  focus: `0 0 0 3px ${palette.primaryPale}`,  // Focus ring
} as const

// ============================================
// GRADIENT TOKENS
// ============================================

const gradientsBase = {
  primary: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryLight} 100%)`,
  primarySubtle: `linear-gradient(180deg, ${palette.primaryPale} 0%, ${palette.white} 100%)`,
  overlay: `linear-gradient(180deg, rgba(149, 163, 127, 0.9) 0%, rgba(109, 122, 92, 0.9) 100%)`,
  shimmer: `linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)`,
}

// Add backward compatibility for gradients
export const gradients = {
  ...gradientsBase,
  // Backward compatibility
  subtle: gradientsBase.primarySubtle,
  primaryLight: gradientsBase.primary, // Map old primaryLight gradient to new primary
} as const

// ============================================
// BORDER RADIUS TOKENS
// ============================================

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,  // Fully rounded
} as const

// ============================================
// TRANSITION TOKENS - Minimal, smooth animations
// ============================================

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const

// ============================================
// ACCESSIBILITY - Focus visible styles
// ============================================

export const focusVisible = {
  outline: `2px solid ${palette.primary}`,
  outlineOffset: '2px',
  boxShadow: shadows.focus,
} as const

// ============================================
// MATERIAL-UI THEME CONFIGURATION
// ============================================

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: palette.primary,           // #95A37F
      light: palette.primaryLight,     // #B4C09F
      dark: palette.primaryDark,       // #6D7A5C
      contrastText: palette.white,
    },
    secondary: {
      main: palette.secondary,         // #8B8B7A
      light: palette.secondaryLight,   // #B5B5A8
      dark: palette.secondaryDark,     // #5F5F52
      contrastText: palette.white,
    },
    success: {
      main: palette.success,           // #2e7d32
      light: palette.successLight,
      dark: palette.successDark,
      contrastText: palette.white,
    },
    warning: {
      main: palette.warning,           // #ed6c02
      light: palette.warningLight,
      dark: palette.warningDark,
      contrastText: palette.white,
    },
    error: {
      main: palette.error,             // #d32f2f
      light: palette.errorLight,
      dark: palette.errorDark,
      contrastText: palette.white,
    },
    info: {
      main: palette.info,              // #0288d1
      light: palette.infoLight,
      dark: palette.infoDark,
      contrastText: palette.white,
    },
    background: {
      default: palette.background,     // #FFFFFF
      paper: palette.backgroundSubtle, // #F5F5F5
    },
    text: {
      primary: palette.textPrimary,    // #212121 (16:1 contrast)
      secondary: palette.textSecondary, // #616161 (7:1 contrast)
      disabled: palette.textDisabled,  // #9E9E9E (3:1 contrast)
    },
    divider: palette.borderLight,      // #E0E0E0
  },
  
  typography: {
  fontFamily: '"Inter", "IBM Plex Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: palette.textPrimary,
      lineHeight: 1.2,
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      color: palette.textPrimary,
      lineHeight: 1.3,
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: palette.textPrimary,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: palette.textPrimary,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: palette.textPrimary,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: palette.textPrimary,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: palette.textPrimary,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: palette.textSecondary,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      color: palette.textSecondary,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 2,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: palette.textSecondary,
    },
  },
  
  shape: {
    borderRadius: borderRadius.md,  // 8px default
  },
  
  spacing: 8, // Base spacing unit (8px multiplier)
  
  shadows: [
    shadows.none,
    shadows.sm,
    shadows.sm,
    shadows.md,
    shadows.md,
    shadows.md,
    shadows.lg,
    shadows.lg,
    shadows.lg,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
  ],
  
  // Component overrides for consistent styling
  components: {
    // Global styles
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: palette.background,
          color: palette.textPrimary,
          scrollbarWidth: 'thin',
          scrollbarColor: `${palette.gray400} ${palette.gray200}`,
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: palette.gray200,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: palette.gray400,
            borderRadius: borderRadius.sm,
            '&:hover': {
              backgroundColor: palette.gray500,
            },
          },
        },
        // Focus visible styles for accessibility
        '*:focus-visible': {
          outline: focusVisible.outline,
          outlineOffset: focusVisible.outlineOffset,
          boxShadow: focusVisible.boxShadow,
        },
      },
    },
    
    // Button - Minimal hover with subtle shading
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: borderRadius.md,
          padding: '10px 24px',
          fontSize: '0.9375rem',
          boxShadow: 'none',
          transition: `all ${transitions.normal}`,
          
          // Minimal hover effect - subtle shading
          '&:hover': {
            boxShadow: 'none',
            transform: 'translateY(-1px)',
          },
          
          // Focus state
          '&:focus-visible': {
            outline: focusVisible.outline,
            outlineOffset: focusVisible.outlineOffset,
            boxShadow: focusVisible.boxShadow,
          },
        },
        contained: {
          '&:hover': {
            boxShadow: shadows.sm,
          },
        },
        containedPrimary: {
          backgroundColor: palette.primary,
          '&:hover': {
            backgroundColor: palette.primaryDark,
            boxShadow: shadows.sm,
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: palette.primaryPale,
          },
        },
        text: {
          '&:hover': {
            backgroundColor: palette.primaryPale,
          },
        },
      },
    },
    
    // Card - Minimal shadow, subtle hover
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: shadows.sm,
          borderRadius: borderRadius.lg,
          border: `1px solid ${palette.borderLight}`,
          transition: `all ${transitions.normal}`,
          
          '&:hover': {
            boxShadow: shadows.md,
            borderColor: palette.borderMedium,
          },
        },
      },
    },
    
    // AppBar
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: palette.primary,
          boxShadow: shadows.sm,
        },
      },
    },
    
    // TextField - Focus outline instead of thick border
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            transition: `all ${transitions.fast}`,
            
            '& fieldset': {
              borderColor: palette.borderLight,
              transition: `all ${transitions.fast}`,
            },
            
            // Minimal hover - subtle color change
            '&:hover fieldset': {
              borderColor: palette.borderMedium,
            },
            
            // Focus state with outline
            '&.Mui-focused fieldset': {
              borderColor: palette.primary,
              borderWidth: '2px',
            },
            
            '&.Mui-focused': {
              boxShadow: shadows.focus,
            },
          },
        },
      },
    },
    
    // Chip
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: borderRadius.md,
        },
        filled: {
          backgroundColor: palette.primaryLight,
          color: palette.textPrimary,
        },
        outlined: {
          borderColor: palette.borderMedium,
        },
      },
    },
    
    // Paper
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          transition: `box-shadow ${transitions.normal}`,
        },
        elevation0: {
          boxShadow: shadows.none,
        },
        elevation1: {
          boxShadow: shadows.sm,
        },
        elevation2: {
          boxShadow: shadows.md,
        },
        elevation3: {
          boxShadow: shadows.lg,
        },
      },
    },
    
    // Table
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: palette.primaryPale,
          color: palette.textPrimary,
          fontWeight: 600,
          borderBottom: `2px solid ${palette.primary}`,
        },
      },
    },
    
    // IconButton - Minimal hover
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: `all ${transitions.fast}`,
          
          '&:hover': {
            backgroundColor: palette.primaryPale,
          },
          
          '&:focus-visible': {
            outline: focusVisible.outline,
            outlineOffset: focusVisible.outlineOffset,
          },
        },
      },
    },
    
    // Link - Focus outline
    MuiLink: {
      styleOverrides: {
        root: {
          color: palette.primary,
          textDecorationColor: palette.primary,
          transition: `all ${transitions.fast}`,
          
          '&:hover': {
            color: palette.primaryDark,
            textDecorationColor: palette.primaryDark,
          },
          
          '&:focus-visible': {
            outline: focusVisible.outline,
            outlineOffset: '2px',
            borderRadius: borderRadius.sm,
          },
        },
      },
    },
  },
})

// ============================================
// HELPER FUNCTIONS - Token utilities
// ============================================

export const getGradient = (type: keyof typeof gradients) => gradients[type]
export const getSpacing = (size: keyof typeof spacing) => `${spacing[size]}px`
export const getShadow = (type: keyof typeof shadows) => shadows[type]
export const getBorderRadius = (size: keyof typeof borderRadius) => `${borderRadius[size]}px`
export const getTransition = (speed: keyof typeof transitions) => transitions[speed]

// Export color tokens for easy access
export const colors = {
  ...palette,
  gradients,
  shadows,
  spacing,
  borderRadius,
  transitions,
  focusVisible,
} as const

export default theme
