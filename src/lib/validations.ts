import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true; // Optional or validate if entered
        const cleaned = val.replace(/[\s\-\(\)]/g, '');
        return /^(?:\+?91|0)?[6-9]\d{9}$/.test(cleaned);
      },
      { message: 'Please enter a valid 10-digit Indian mobile number (e.g. 9816012345)' }
    ),
  whatsappConsent: z.boolean().optional().default(true),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const saveAnswerSchema = z.object({
  attemptId: z.string(),
  questionId: z.string(),
  selectedOption: z.enum(['A', 'B', 'C', 'D']).nullable().optional(),
  isMarkedForReview: z.boolean().optional(),
  timeSpentSeconds: z.number().int().nonnegative().optional(),
});

export const createOrderSchema = z.object({
  examId: z.string(),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  examId: z.string(),
});
