import { phoneSchema, z } from '@solvera/pace-core/utils';
import type { ContactFormData } from '@/features/contacts/types';

const optionalTrimmedText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' ? undefined : value));

const optionalPhone = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? '' : value),
  phoneSchema
).transform((value) => (value === '' ? undefined : value));

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' ? undefined : value))
  .pipe(
    z
      .string()
      .email('Enter a valid email address')
      .optional()
  );

export const contactFormSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required'),
  surname: z.string().trim().min(1, 'Surname is required'),
  role: optionalTrimmedText,
  phone_number: optionalPhone,
  email_address: optionalEmail,
});

export type ContactFormInput = z.input<typeof contactFormSchema>;

export function parseContactFormData(input: Partial<ContactFormInput>): ContactFormData {
  const result = contactFormSchema.safeParse(input);
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join('; ');
    throw new Error(message);
  }
  return result.data;
}
