import { describe, it, expect } from 'vitest';
import { parseContactFormData } from '@/features/contacts/contact-schema';

describe('parseContactFormData', () => {
  it('accepts valid contact fields', () => {
    const data = parseContactFormData({
      first_name: 'Alex',
      surname: 'Lee',
      email_address: 'alex@example.com',
    });
    expect(data.first_name).toBe('Alex');
    expect(data.surname).toBe('Lee');
    expect(data.email_address).toBe('alex@example.com');
  });

  it('rejects invalid email format', () => {
    expect(() =>
      parseContactFormData({
        first_name: 'Alex',
        surname: 'Lee',
        email_address: 'not-an-email',
      })
    ).toThrow(/valid email/i);
  });

  it('rejects invalid phone format when provided', () => {
    expect(() =>
      parseContactFormData({
        first_name: 'Alex',
        surname: 'Lee',
        phone_number: 'not-a-phone',
      })
    ).toThrow(/phone/i);
  });
});
