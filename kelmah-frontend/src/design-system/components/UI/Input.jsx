import React, { useState, useCallback } from 'react';
import {
  TextField,
  FormControl,
  FormLabel,
  FormHelperText,
  InputAdornment,
  IconButton,
  Box,
  Fade,
  Autocomplete,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Checkbox,
  Radio,
  RadioGroup,
  Slider,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Visibility,
  VisibilityOff,
  Clear,
  Search,
  Check,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { BORDER_RADIUS, SEMANTIC_SPACING } from '../../foundations/spacing';
import { PRIMARY_COLORS } from '../../foundations/colors';
import { FONT_WEIGHTS } from '../../foundations/typography';

/**
 * Input Component - Enhanced form inputs with validation and animations
 * 
 * Features:
 * - Multiple input types (text, password, email, search, select, etc.)
 * - Built-in validation with visual feedback
 * - Loading and disabled states
 * - Icon support and custom adornments
 * - Smooth animations and transitions
 * - Accessibility features
 */

const StyledFormControl = styled(FormControl)(({ theme, error, success, warning }) => ({
  marginBottom: SEMANTIC_SPACING.form.field,
  
  '& .MuiInputLabel-root': {
    fontWeight: FONT_WEIGHTS.medium,
    color: theme.palette.text.secondary,
    
    '&.Mui-focused': {
      color: error ? theme.palette.error.main : 
            success ? theme.palette.success.main :
            warning ? theme.palette.warning.main :
            theme.palette.primary.main,
    },
  },
  
  '& .MuiOutlinedInput-root': {
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: theme.palette.background.paper,
    transition: theme.transitions.create(['border-color', 'background-color', 'box-shadow']),
    
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: error ? theme.palette.error.main : 
                    success ? theme.palette.success.main :
                    warning ? theme.palette.warning.main :
                    theme.palette.primary.main,
      },
    },
    
    '&.Mui-focused': {
      backgroundColor: theme.palette.background.default,
      boxShadow: `0 0 0 3px ${
        error ? theme.palette.error.main + '20' : 
        success ? theme.palette.success.main + '20' :
        warning ? theme.palette.warning.main + '20' :
        theme.palette.primary.main + '20'
      }`,
      
      '& .MuiOutlinedInput-notchedOutline': {
        borderWidth: '2px',
        borderColor: error ? theme.palette.error.main : 
                    success ? theme.palette.success.main :
                    warning ? theme.palette.warning.main :
                    theme.palette.primary.main,
      },
    },
    
    '&.Mui-error .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.error.main,
    },
  },
  
  '& .MuiFormHelperText-root': {
    marginLeft: SEMANTIC_SPACING.component.xs,
    marginTop: SEMANTIC_SPACING.component.xs,
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: SEMANTIC_SPACING.component.xs,
  },
}));

const ValidationIcon = styled(motion.div)(({ theme, type }) => ({
  display: 'flex',
  alignItems: 'center',
  color: type === 'error' ? theme.palette.error.main :
        type === 'success' ? theme.palette.success.main :
        theme.palette.warning.main,
}));

const Input = ({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  helperText,
  required = false,
  disabled = false,
  loading = false,
  validation,
  startIcon,
  endIcon,
  clearable = false,
  searchable = false,
  options = [], // for select/autocomplete
  multiline = false,
  rows = 4,
  maxLength,
  showCharCount = false,
  debounceMs = 300,
  size = 'medium',
  fullWidth = true,
  autoFocus = false,
  name,
  id,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');
  const [validationState, setValidationState] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  // Debounced validation
  const validateInput = useCallback((inputValue) => {
    if (!validation) return;
    
    setTimeout(() => {
      const result = validation(inputValue);
      setValidationState(result);
    }, debounceMs);
  }, [validation, debounceMs]);

  const handleChange = (event) => {
    const newValue = event.target.value;
    
    // Character limit enforcement
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    
    setInternalValue(newValue);
    onChange?.(event);
    validateInput(newValue);
  };

  const handleFocus = (event) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  const handleClear = () => {
    const event = { target: { value: '' } };
    setInternalValue('');
    onChange?.(event);
    setValidationState(null);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Determine validation state
  const isError = error || validationState?.type === 'error';
  const isSuccess = validationState?.type === 'success';
  const isWarning = validationState?.type === 'warning';
  const displayHelperText = helperText || validationState?.message;

  // Build start adornment
  const startAdornment = (startIcon || searchable) ? (
    <InputAdornment position="start">
      {searchable ? <Search /> : startIcon}
    </InputAdornment>
  ) : null;

  // Build end adornment
  const endAdornment = (
    <InputAdornment position="end">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Validation icon */}
        {(isError || isSuccess || isWarning) && (
          <Fade in>
            <ValidationIcon
              type={isError ? 'error' : isSuccess ? 'success' : 'warning'}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {isError ? <ErrorIcon fontSize="small" /> :
               isSuccess ? <Check fontSize="small" /> :
               <WarningIcon fontSize="small" />}
            </ValidationIcon>
          </Fade>
        )}
        
        {/* Clear button */}
        {clearable && internalValue && !disabled && (
          <IconButton
            size="small"
            onClick={handleClear}
            edge="end"
          >
            <Clear fontSize="small" />
          </IconButton>
        )}
        
        {/* Password visibility toggle */}
        {type === 'password' && (
          <IconButton
            size="small"
            onClick={togglePasswordVisibility}
            edge="end"
          >
            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
          </IconButton>
        )}
        
        {/* Custom end icon */}
        {endIcon}
        
        {/* Loading indicator */}
        {loading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            ⟳
          </motion.div>
        )}
      </Box>
    </InputAdornment>
  );

  // Character count display
  const characterCount = showCharCount && maxLength ? (
    <Box sx={{ 
      textAlign: 'right', 
      fontSize: '0.75rem', 
      opacity: 0.7,
      mt: 0.5,
    }}>
      {internalValue.length}/{maxLength}
    </Box>
  ) : null;

  const commonProps = {
    label,
    placeholder,
    value: internalValue,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    error: isError,
    disabled: disabled || loading,
    required,
    fullWidth,
    size,
    autoFocus,
    name,
    id,
    InputProps: {
      startAdornment,
      endAdornment,
    },
    ...props,
  };

  // Render different input types
  const renderInput = () => {
    if (type === 'select') {
      return (
        <Select {...commonProps} displayEmpty>
          {placeholder && (
            <MenuItem value="" disabled>
              <em>{placeholder}</em>
            </MenuItem>
          )}
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      );
    }

    if (type === 'autocomplete') {
      return (
        <Autocomplete
          options={options}
          getOptionLabel={(option) => option.label || option}
          renderInput={(params) => (
            <TextField
              {...params}
              {...commonProps}
            />
          )}
        />
      );
    }

    return (
      <TextField
        {...commonProps}
        type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
        multiline={multiline}
        rows={multiline ? rows : undefined}
      />
    );
  };

  return (
    <StyledFormControl
      error={isError}
      success={isSuccess}
      warning={isWarning}
      fullWidth={fullWidth}
    >
      {renderInput()}
      {displayHelperText && (
        <FormHelperText>
          {displayHelperText}
        </FormHelperText>
      )}
      {characterCount}
    </StyledFormControl>
  );
};

Input.propTypes = {
  type: PropTypes.oneOf([
    'text', 'password', 'email', 'tel', 'url', 'search', 
    'number', 'select', 'autocomplete'
  ]),
  label: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  validation: PropTypes.func,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  clearable: PropTypes.bool,
  searchable: PropTypes.bool,
  options: PropTypes.array,
  multiline: PropTypes.bool,
  rows: PropTypes.number,
  maxLength: PropTypes.number,
  showCharCount: PropTypes.bool,
  debounceMs: PropTypes.number,
  size: PropTypes.oneOf(['small', 'medium']),
  fullWidth: PropTypes.bool,
  autoFocus: PropTypes.bool,
  name: PropTypes.string,
  id: PropTypes.string,
};

// Specialized input components
export const SearchInput = (props) => (
  <Input type="search" searchable clearable {...props} />
);

export const PasswordInput = (props) => (
  <Input type="password" {...props} />
);

export const EmailInput = (props) => (
  <Input 
    type="email" 
    validation={(value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) return null;
      return emailRegex.test(value) 
        ? { type: 'success', message: 'Valid email address' }
        : { type: 'error', message: 'Please enter a valid email address' };
    }}
    {...props} 
  />
);

export const PhoneInput = (props) => (
  <Input 
    type="tel" 
    validation={(value) => {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (!value) return null;
      return phoneRegex.test(value)
        ? { type: 'success', message: 'Valid phone number' }
        : { type: 'error', message: 'Please enter a valid phone number' };
    }}
    {...props} 
  />
);

export const NumberInput = (props) => (
  <Input type="number" {...props} />
);

export const TextArea = ({ rows = 4, ...props }) => (
  <Input multiline rows={rows} {...props} />
);

export const SelectInput = ({ options = [], ...props }) => (
  <Input type="select" options={options} {...props} />
);

export const AutocompleteInput = ({ options = [], ...props }) => (
  <Input type="autocomplete" options={options} {...props} />
);

// Form control components
export const SwitchInput = ({ 
  label, 
  checked, 
  onChange, 
  disabled = false,
  ...props 
}) => (
  <FormControlLabel
    control={
      <Switch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        sx={{
          '& .MuiSwitch-switchBase.Mui-checked': {
            color: PRIMARY_COLORS.gold[500],
          },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: PRIMARY_COLORS.gold[500],
          },
        }}
        {...props}
      />
    }
    label={label}
    disabled={disabled}
  />
);

export const CheckboxInput = ({ 
  label, 
  checked, 
  onChange, 
  disabled = false,
  ...props 
}) => (
  <FormControlLabel
    control={
      <Checkbox
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        sx={{
          color: PRIMARY_COLORS.gold[500],
          '&.Mui-checked': {
            color: PRIMARY_COLORS.gold[500],
          },
        }}
        {...props}
      />
    }
    label={label}
    disabled={disabled}
  />
);

export const RadioInput = ({ 
  options = [], 
  value, 
  onChange, 
  label,
  disabled = false,
  ...props 
}) => (
  <FormControl disabled={disabled}>
    {label && <FormLabel>{label}</FormLabel>}
    <RadioGroup value={value} onChange={onChange} {...props}>
      {options.map((option) => (
        <FormControlLabel
          key={option.value}
          value={option.value}
          control={
            <Radio
              sx={{
                color: PRIMARY_COLORS.gold[500],
                '&.Mui-checked': {
                  color: PRIMARY_COLORS.gold[500],
                },
              }}
            />
          }
          label={option.label}
        />
      ))}
    </RadioGroup>
  </FormControl>
);

export const SliderInput = ({ 
  label, 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1,
  marks = false,
  disabled = false,
  ...props 
}) => (
  <FormControl fullWidth disabled={disabled}>
    {label && <FormLabel sx={{ mb: 2 }}>{label}</FormLabel>}
    <Slider
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
      marks={marks}
      valueLabelDisplay="auto"
      sx={{
        color: PRIMARY_COLORS.gold[500],
        '& .MuiSlider-thumb': {
          backgroundColor: PRIMARY_COLORS.gold[500],
        },
        '& .MuiSlider-track': {
          backgroundColor: PRIMARY_COLORS.gold[500],
        },
        '& .MuiSlider-rail': {
          opacity: 0.3,
        },
      }}
      {...props}
    />
  </FormControl>
);

export default Input; 