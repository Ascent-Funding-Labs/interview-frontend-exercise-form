import * as yup from 'yup';
import { z } from 'zod';

export const userValidationSchema = yup.object().shape({
  firstName: yup.string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name is too long'),

  lastName: yup.string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name is too long'),

  email: yup.string()
    .required('Email is required')
    .email('Please enter a valid email address'),

  password: yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number'),

  confirmPassword: yup.string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),

  phone: yup.string()
    .matches(/^\d{10}$/, 'Phone number must be 10 digits')
    .nullable(),
});

export const userZodSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
});

export type UserSchemaType = z.infer<typeof userZodSchema>;

export const businessValidationSchema = yup.object().shape({
  businessName: yup.string().required('Business name is required'),
  taxId: yup.string().required('Tax ID is required'),
});
