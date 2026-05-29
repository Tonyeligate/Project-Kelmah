import { z } from 'zod';

export const ACCOUNT_TYPES = ['worker', 'hirer'];
export const GHANA_PHONE_REGEX = /^(\+233|0)[0-9]{9}$/;
export const normalizeGhanaPhone = (value) =>
  typeof value === 'string' ? value.replace(/\s+/g, '').trim() : value;
export const isValidGhanaPhone = (value) =>
  typeof value === 'string' &&
  GHANA_PHONE_REGEX.test(normalizeGhanaPhone(value));

export const calculatePasswordStrength = (password = '') => {
  let score = 0;
  if (password.length >= 12) score += 1;
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
    phone: z.preprocess(
      normalizeGhanaPhone,
      z
        .string({ required_error: 'Phone number is required' })
        .min(1, 'Phone number is required')
        .regex(GHANA_PHONE_REGEX, 'Please enter a valid Ghana phone number'),
    ),
    password: z
      .string({ required_error: 'Password is required' })
      .min(12, 'Password must be at least 12 characters long'),
    confirmPassword: z
      .string({ required_error: 'Please confirm your password' })
      .min(12, 'Please confirm your password'),
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

    // Enforce same password policy as backend SecurityUtils:
    // - Minimum 12 characters
    // - At least one uppercase, one lowercase, one digit, and one symbol
    const pwd = data.password || '';
    if (pwd.length < 12) {
      ctx.addIssue({
        path: ['password'],
        code: z.ZodIssueCode.custom,
        message: 'Password must be at least 12 characters long',
      });
    } else {
      if (!/[A-Z]/.test(pwd)) {
        ctx.addIssue({
          path: ['password'],
          code: z.ZodIssueCode.custom,
          message: 'Password must include at least one uppercase letter',
        });
      }
      if (!/[a-z]/.test(pwd)) {
        ctx.addIssue({
          path: ['password'],
          code: z.ZodIssueCode.custom,
          message: 'Password must include at least one lowercase letter',
        });
      }
      if (!/[0-9]/.test(pwd)) {
        ctx.addIssue({
          path: ['password'],
          code: z.ZodIssueCode.custom,
          message: 'Password must include at least one number',
        });
      }
      if (!/[^A-Za-z0-9]/.test(pwd)) {
        ctx.addIssue({
          path: ['password'],
          code: z.ZodIssueCode.custom,
          message: 'Password must include at least one symbol (e.g. !@#$)',
        });
      }
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
