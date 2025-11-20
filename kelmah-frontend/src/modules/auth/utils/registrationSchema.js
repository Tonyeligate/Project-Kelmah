import { z } from 'zod';

export const ACCOUNT_TYPES = ['worker', 'hirer'];
export const GHANA_PHONE_REGEX = /^(\+233|0)[0-9]{9}$/;

export const calculatePasswordStrength = (password = '') => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  let label = 'Weak';
  if (score >= 4) {
    label = 'Strong';
  } else if (score >= 3) {
    label = 'Medium';
  }

  return { score, label };
};

const baseString = (field, min = 1) =>
  z
    .string({ required_error: `${field} is required` })
    .trim()
    .min(min, `${field} is required`);

export const registrationSchema = z
  .object({
    role: z.enum(ACCOUNT_TYPES, {
      required_error: 'Please choose an account type',
    }),
    firstName: baseString('First name', 2),
    lastName: baseString('Last name', 2),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address'),
    phone: z
      .string({ required_error: 'Phone number is required' })
      .trim()
      .regex(GHANA_PHONE_REGEX, 'Please enter a valid Ghana phone number'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z
      .string({ required_error: 'Please confirm your password' })
      .min(8, 'Please confirm your password'),
    companyName: z.string().trim().optional().default(''),
    trades: z.array(z.string().min(2)).optional().default([]),
    experienceYears: z
      .preprocess((value) => {
        if (value === '' || value === null || value === undefined) {
          return undefined;
        }
        const parsed = Number(value);
        return Number.isNaN(parsed) ? value : parsed;
      }, z.number().int().min(0).max(60))
      .optional(),
    acceptTerms: z.boolean().refine(Boolean, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        path: ['confirmPassword'],
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match',
      });
    }

    const { score } = calculatePasswordStrength(data.password);
    if (score < 3) {
      ctx.addIssue({
        path: ['password'],
        code: z.ZodIssueCode.custom,
        message:
          'Please choose a stronger password with uppercase, lowercase, numbers, and symbols',
      });
    }

    if (data.role === 'hirer' && !data.companyName?.trim()) {
      ctx.addIssue({
        path: ['companyName'],
        code: z.ZodIssueCode.custom,
        message: 'Company name is required for hirer accounts',
      });
    }

    if (data.role === 'worker' && (!data.trades || data.trades.length === 0)) {
      ctx.addIssue({
        path: ['trades'],
        code: z.ZodIssueCode.custom,
        message: 'Please select at least one trade/skill',
      });
    }
  });

export const registrationDefaultValues = {
  role: 'worker',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  companyName: '',
  trades: [],
  experienceYears: undefined,
  acceptTerms: false,
};
