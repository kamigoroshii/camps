import { TextField, TextFieldProps } from '@mui/material'

interface OliveInputProps extends Omit<TextFieldProps, 'variant' | 'color'> {
  variant?: 'outlined' | 'filled'
}

export default function OliveInput({ variant = 'outlined', ...props }: OliveInputProps) {
  const oliveFocusStyle = {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: '#95A37F',
        borderWidth: '2px',
      },
      '&:hover:not(.Mui-disabled) fieldset': {
        borderColor: '#95A37F',
      },
    },
    '& .MuiFilledInput-root': {
      backgroundColor: '#e8f0e0',
      '&:hover:not(.Mui-disabled)': {
        backgroundColor: '#e8f0e0',
      },
      '&.Mui-focused': {
        backgroundColor: '#e8f0e0',
      },
      '&::before': {
        borderBottomColor: '#95A37F',
      },
      '&:hover::before': {
        borderBottomColor: '#95A37F !important',
      },
      '&::after': {
        borderBottomColor: '#95A37F',
        borderBottomWidth: '2px',
      },
    },
    '& .MuiInputLabel-root': {
      '&.Mui-focused': {
        color: '#95A37F',
      },
    },
    '& .MuiInputBase-root:focus-within': {
      outline: variant === 'outlined' ? 'none' : '2px solid #95A37F',
      outlineOffset: variant === 'outlined' ? 0 : 2,
    },
  }

  return (
    <TextField
      {...props}
      variant={variant}
      sx={{
        ...oliveFocusStyle,
        ...props.sx,
      }}
    />
  )
}
