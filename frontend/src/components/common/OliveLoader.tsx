import { Box, CircularProgress, LinearProgress, Typography } from '@mui/material'

interface OliveLoaderProps {
  variant?: 'circular' | 'linear'
  size?: 'small' | 'medium' | 'large'
  fullScreen?: boolean
  message?: string
  progress?: number
}

export default function OliveLoader({
  variant = 'circular',
  size = 'medium',
  fullScreen = false,
  message,
  progress,
}: OliveLoaderProps) {
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60,
  }

  const circularSize = sizeMap[size]

  const loader = variant === 'circular' ? (
    <CircularProgress
      size={circularSize}
      thickness={4}
      sx={{
        color: '#95A37F',
        '& .MuiCircularProgress-circle': {
          strokeLinecap: 'round',
        },
      }}
      variant={progress !== undefined ? 'determinate' : 'indeterminate'}
      value={progress}
    />
  ) : (
    <Box sx={{ width: '100%', maxWidth: 400 }}>
      <LinearProgress
        sx={{
          height: size === 'small' ? 4 : size === 'medium' ? 6 : 8,
          borderRadius: 4,
          bgcolor: '#e8f0e0',
          '& .MuiLinearProgress-bar': {
            bgcolor: '#95A37F',
            borderRadius: 4,
          },
        }}
        variant={progress !== undefined ? 'determinate' : 'indeterminate'}
        value={progress}
      />
      {progress !== undefined && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 1,
            color: '#636b2f',
            fontWeight: 500,
          }}
        >
          {progress}%
        </Typography>
      )}
    </Box>
  )

  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          zIndex: 9999,
          gap: 2,
        }}
      >
        {loader}
        {message && (
          <Typography
            variant="body1"
            sx={{
              color: '#636b2f',
              fontWeight: 500,
              mt: 2,
            }}
          >
            {message}
          </Typography>
        )}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
      }}
    >
      {loader}
      {message && (
        <Typography
          variant="body2"
          sx={{
            color: '#636b2f',
            fontWeight: 500,
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  )
}
