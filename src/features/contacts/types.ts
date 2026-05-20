/** Row shape for `public.trac_contacts` (dev-db). */
export interface Contact extends Record<string, unknown> {
  id: string;
  event_id: string;
  organisation_id: string;
  first_name: string;
  surname: string;
  role: string | null;
  phone_number: string | null;
  email_address: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/** Writable contact fields (excludes audit and scope ids). */
export interface ContactFormData {
  first_name: string;
  surname: string;
  role?: string;
  phone_number?: string;
  email_address?: string;
}
