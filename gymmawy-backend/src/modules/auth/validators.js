import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    "Password must be at least 8 characters with uppercase, lowercase, and number"
  ),
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  mobileNumber: z.string().optional(),
  birthDate: z.string().optional(),
  building: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postcode: z.string().optional(),
  language: z.string().optional().default('en'),
});

export const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(8),
});

export const emailTokenSchema = z.object({ token: z.string().min(10), email: z.string().email() });

export const forgotSchema = z.object({ 
  email: z.string().email(),
  language: z.string().optional().default('en')
});

export const resetSchema = z.object({ token: z.string().min(10), email: z.string().email(), newPassword: z.string().min(8) });

// Profile update validation schema - same validations as signup but all fields optional
export const profileUpdateSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name must be less than 50 characters").optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name must be less than 50 characters").optional(),
  mobileNumber: z.string().min(7, "Phone number must be at least 7 digits").max(15, "Phone number must be less than 15 digits").optional(),
  birthDate: z.string().optional(),
  building: z.string().min(1, "Building must not be empty").max(100, "Building must be less than 100 characters").optional(),
  street: z.string().min(5, "Street must be at least 5 characters").max(100, "Street must be less than 100 characters").optional(),
  city: z.string().min(2, "City must be at least 2 characters").max(50, "City must be less than 50 characters").optional(),
  country: z.string().min(2, "Country must be at least 2 characters").max(50, "Country must be less than 50 characters").optional(),
  postcode: z.string().min(3, "Postcode must be at least 3 characters").max(20, "Postcode must be less than 20 characters").optional(),
});


