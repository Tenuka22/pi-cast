import * as v from 'valibot'

export const emailSchema = v.pipe(
  v.string('Email is required'),
  v.email('Invalid email address'),
  v.minLength(1, 'Email is required'),
  v.maxLength(255, 'Email must be less than 255 characters'),
)

export const passwordSchema = v.pipe(
  v.string('Password is required'),
  v.minLength(8, 'Password must be at least 8 characters'),
  v.maxLength(100, 'Password must be less than 100 characters'),
)

export const signInSchema = v.object({
  email: emailSchema,
  password: passwordSchema,
})

export const signUpSchema = v.object({
  email: emailSchema,
  password: passwordSchema,
  name: v.pipe(
    v.string('Name is required'),
    v.minLength(1, 'Name is required'),
    v.maxLength(100, 'Name must be less than 100 characters'),
  ),
})

export const magicLinkSchema = v.object({
  email: emailSchema,
})

export const verifyMagicLinkSchema = v.object({
  token: v.pipe(
    v.string('Token is required'),
    v.minLength(1, 'Token is required'),
  ),
})

export const githubCallbackSchema = v.object({
  code: v.pipe(
    v.string('Code is required'),
    v.minLength(1, 'Code is required'),
  ),
  state: v.pipe(
    v.string('State is required'),
    v.minLength(1, 'State is required'),
  ),
})
