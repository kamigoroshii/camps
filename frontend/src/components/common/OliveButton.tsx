import { Button, ButtonProps, CircularProgress } from '@mui/material'
import { ReactNode } from 'react'

interface OliveButtonProps extends Omit<ButtonProps, 'variant' | 'color' | 'size'> {
  variant?: 'filled' | 'outlined' | 'text'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  children: ReactNode
  fullWidth?: boolean
}

export default function OliveButton({
  variant = 'filled',
  size = 'medium',
  loading = false,
  children,
  fullWidth = false,
  disabled,
  ...props
}: OliveButtonProps) {
  const sizeStyles = {
    small: { px: 2, py: 0.75, fontSize: '0.875rem' },
    medium: { px: 3, py: 1, fontSize: '1rem' },
    large: { px: 4, py: 1.5, fontSize: '1.125rem' },
  }

  const variantStyles = {
    filled: {
      bgcolor: '#95A37F',
      color: 'white',
      border: 'none',
      '&:hover': {
        bgcolor: '#95A37F',
        opacity: 0.95,
      },
      '&:focus': {
        outline: '2px solid #95A37F',
        outlineOffset: 2,
        bgcolor: '#95A37F',
      },
      '&:active': {
        bgcolor: '#7a8566',
      },
      '&.Mui-disabled': {
        bgcolor: '#e0e0e0',
        color: '#9e9e9e',
      },
    },
    outlined: {
      bgcolor: 'transparent',
      color: '#95A37F',
      border: '2px solid #95A37F',
      borderWidth: 2,
      '&:hover': {
        bgcolor: '#e8f0e0',
        border: '2px solid #95A37F',
        borderWidth: 2,
      },
      '&:focus': {
        outline: '2px solid #95A37F',
        outlineOffset: 2,
        bgcolor: '#e8f0e0',
        border: '2px solid #95A37F',
      },
      '&:active': {
        bgcolor: '#d4ddc7',
      },
      '&.Mui-disabled': {
        border: '2px solid #e0e0e0',
        color: '#9e9e9e',
      },
    },
    text: {
      bgcolor: 'transparent',
      color: '#95A37F',
      border: 'none',
      '&:hover': {
        bgcolor: '#e8f0e0',
      },
      '&:focus': {
        outline: '2px solid #95A37F',
        outlineOffset: 2,
        bgcolor: '#e8f0e0',
      },
      '&:active': {
        bgcolor: '#d4ddc7',
      },
      '&.Mui-disabled': {
        color: '#9e9e9e',
      },
    },
  }

  return (
    <Button
      {...props}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      sx={{
        ...sizeStyles[size],
        ...variantStyles[variant],
        fontWeight: 600,
        textTransform: 'none',
        borderRadius: 1,
        position: 'relative',
        ...props.sx,
      }}
    >
      {loading && (
        <CircularProgress
          size={16}
          sx={{
            color: variant === 'filled' ? 'white' : '#95A37F',
            position: 'absolute',
            left: '50%',
            marginLeft: '-8px',
          }}
        />
      )}
      <span style={{ visibility: loading ? 'hidden' : 'visible' }}>{children}</span>
    </Button>
  )
}
