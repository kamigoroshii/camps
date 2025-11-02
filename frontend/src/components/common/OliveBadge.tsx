import { Chip, ChipProps } from '@mui/material'
import { ReactElement } from 'react'

interface OliveBadgeProps extends Omit<ChipProps, 'variant' | 'color' | 'size' | 'icon'> {
  variant?: 'filled' | 'outlined' | 'status'
  size?: 'small' | 'medium' | 'large'
  status?: 'success' | 'warning' | 'error' | 'info' | 'pending'
  label: string
  icon?: ReactElement
}

export default function OliveBadge({
  variant = 'filled',
  size = 'medium',
  status,
  label,
  icon,
  ...props
}: OliveBadgeProps) {
  const sizeStyles = {
    small: { fontSize: '0.7rem', height: 20 },
    medium: { fontSize: '0.875rem', height: 24 },
    large: { fontSize: '1rem', height: 28 },
  }

  const getStatusColors = () => {
    if (!status) {
      return {
        bgcolor: variant === 'filled' ? '#e8f0e0' : 'transparent',
        color: '#636b2f',
        border: variant === 'outlined' ? '2px solid #95A37F' : 'none',
      }
    }

    const statusColors = {
      success: {
        bgcolor: variant === 'filled' ? '#e8f5e9' : 'transparent',
        color: '#2e7d32',
        border: `${variant === 'outlined' ? '2px' : '1.5px'} solid #2e7d32`,
      },
      warning: {
        bgcolor: variant === 'filled' ? '#fff3e0' : 'transparent',
        color: '#ed6c02',
        border: `${variant === 'outlined' ? '2px' : '1.5px'} solid #ed6c02`,
      },
      error: {
        bgcolor: variant === 'filled' ? '#ffebee' : 'transparent',
        color: '#d32f2f',
        border: `${variant === 'outlined' ? '2px' : '1.5px'} solid #d32f2f`,
      },
      info: {
        bgcolor: variant === 'filled' ? '#e3f2fd' : 'transparent',
        color: '#0288d1',
        border: `${variant === 'outlined' ? '2px' : '1.5px'} solid #0288d1`,
      },
      pending: {
        bgcolor: variant === 'filled' ? '#e8f0e0' : 'transparent',
        color: '#636b2f',
        border: `${variant === 'outlined' ? '2px' : '1.5px'} solid #95A37F`,
      },
    }

    return statusColors[status]
  }

  const colors = getStatusColors()

  return (
    <Chip
      {...props}
      label={label}
      icon={icon as any}
      sx={{
        ...colors,
        ...sizeStyles[size],
        fontWeight: 600,
        borderRadius: 1,
        '&:focus': {
          outline: '2px solid #95A37F',
          outlineOffset: 2,
        },
        '& .MuiChip-icon': {
          color: colors.color,
        },
        ...props.sx,
      }}
    />
  )
}
