# Olive Component Library

A collection of reusable React components styled with the olive color palette (#95A37F). These components are designed with accessibility in mind, featuring clear focus states and minimal hover effects.

## Components

### OliveButton
Customizable button component with olive styling.

**Props:**
- `variant?: 'filled' | 'outlined' | 'text'` - Button style (default: 'filled')
- `size?: 'small' | 'medium' | 'large'` - Button size (default: 'medium')
- `loading?: boolean` - Shows loading spinner (default: false)
- `fullWidth?: boolean` - Expands button to full width (default: false)
- All standard Material-UI ButtonProps

**Example:**
```tsx
<OliveButton variant="filled" size="medium" loading={isSubmitting}>
  Submit Form
</OliveButton>

<OliveButton variant="outlined" startIcon={<AddIcon />}>
  Add New
</OliveButton>
```

### OliveInput
Text input component with olive focus styling.

**Props:**
- `variant?: 'outlined' | 'filled'` - Input style (default: 'outlined')
- All standard Material-UI TextFieldProps

**Example:**
```tsx
<OliveInput
  fullWidth
  label="Email Address"
  placeholder="Enter your email..."
  required
  helperText="We'll never share your email"
/>

<OliveInput
  variant="filled"
  multiline
  rows={4}
  label="Comments"
/>
```

### OliveBadge
Status badge/chip component with customizable colors.

**Props:**
- `label: string` - Badge text (required)
- `variant?: 'filled' | 'outlined'` - Badge style (default: 'filled')
- `size?: 'small' | 'medium' | 'large'` - Badge size (default: 'medium')
- `status?: 'success' | 'warning' | 'error' | 'info' | 'pending'` - Status color
- `icon?: ReactElement` - Optional icon

**Example:**
```tsx
<OliveBadge label="Active" status="success" />
<OliveBadge label="Pending" status="warning" icon={<WarningIcon />} />
<OliveBadge label="Custom" variant="outlined" size="large" />
```

### OliveLoader
Loading indicator with circular or linear variants.

**Props:**
- `variant?: 'circular' | 'linear'` - Loader type (default: 'circular')
- `size?: 'small' | 'medium' | 'large'` - Size for circular (default: 'medium')
- `fullScreen?: boolean` - Covers entire screen (default: false)
- `message?: string` - Optional loading message
- `progress?: number` - Progress percentage (0-100) for determinate mode

**Example:**
```tsx
<OliveLoader variant="circular" size="large" message="Loading data..." />
<OliveLoader variant="linear" progress={75} />
<OliveLoader fullScreen message="Please wait..." />
```

### OliveErrorBoundary
Error boundary component that catches React errors and displays fallback UI.

**Props:**
- `children: ReactNode` - Components to wrap (required)
- `fallback?: ReactNode` - Custom error fallback UI
- `onReset?: () => void` - Callback when user clicks "Try Again"

**Example:**
```tsx
<OliveErrorBoundary>
  <YourApp />
</OliveErrorBoundary>

<OliveErrorBoundary 
  onReset={() => window.location.reload()}
  fallback={<CustomErrorPage />}
>
  <CriticalComponent />
</OliveErrorBoundary>
```

## Color Palette

- **Primary Olive**: #95A37F
- **Light Background**: #e8f0e0
- **Dark Text**: #636b2f
- **Hover/Active**: #7a8566, #d4ddc7

## Design Principles

1. **Focus States**: All interactive components show 2px olive outlines when focused
2. **Minimal Hover**: Hover effects use subtle opacity or background changes, no color shifts
3. **Accessibility**: WCAG 2.1 AA compliant color contrasts
4. **Consistency**: Unified styling across all components

## Usage

Import components from the common barrel export:

```tsx
import {
  OliveButton,
  OliveInput,
  OliveBadge,
  OliveLoader,
  OliveErrorBoundary
} from '@/components/common'
```

## Demo

Visit `/components` route to see all components in action with interactive examples.
