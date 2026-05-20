import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponsibleContactSelect } from '@/features/contacts/components/ResponsibleContactSelect';
import type { Contact } from '@/features/contacts/types';

const mockUseTracContactsPicker = vi.fn();

vi.mock('@/features/contacts/hooks/use-trac-contacts-picker', () => ({
  useTracContactsPicker: () => mockUseTracContactsPicker(),
}));

const sampleContact: Contact = {
  id: 'contact-abc',
  event_id: 'event-1',
  organisation_id: 'org-1',
  first_name: 'River',
  surname: 'Guide',
  role: 'Tour lead',
  phone_number: null,
  email_address: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  created_by: null,
  updated_by: null,
};

describe('ResponsibleContactSelect (SLICE-09 contract)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTracContactsPicker.mockReturnValue({
      contacts: [sampleContact],
      isLoading: false,
      error: null,
    });
  });

  it('lists contacts from picker hook for responsible_contact_id selection', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<ResponsibleContactSelect value={null} onValueChange={onValueChange} />);

    await user.click(screen.getByRole('button', { name: 'Responsible contact' }));

    const option = await screen.findByRole('option', {
      name: 'River Guide (Tour lead)',
      hidden: true,
    });
    await user.click(option);

    expect(onValueChange).toHaveBeenCalledWith('contact-abc');
  });
});
