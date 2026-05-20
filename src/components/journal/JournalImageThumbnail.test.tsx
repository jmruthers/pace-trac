import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { JournalImageThumbnail } from '@/components/journal/JournalImageThumbnail';

const mockUseStorageCapableClient = vi.fn();

vi.mock('@solvera/pace-core/rbac', () => ({
  useStorageCapableClient: () => mockUseStorageCapableClient(),
}));

describe('JournalImageThumbnail', () => {
  beforeEach(() => {
    mockUseStorageCapableClient.mockReturnValue({
      storage: {
        from: () => ({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: 'https://example.com/img' },
            error: null,
          }),
        }),
      },
    });
  });

  afterEach(cleanup);

  it('renders signed image URL', async () => {
    render(<JournalImageThumbnail imageId="img-1" alt="Test image" />);
    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Test image' })).toHaveAttribute(
        'src',
        'https://example.com/img'
      );
    });
  });

  it('shows error when signed URL fails', async () => {
    mockUseStorageCapableClient.mockReturnValue({
      storage: {
        from: () => ({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'denied' },
          }),
        }),
      },
    });

    render(<JournalImageThumbnail imageId="img-2" alt="Broken" />);
    await waitFor(() => {
      expect(screen.getByText(/could not load image/i)).toBeInTheDocument();
    });
  });

  it('shows unavailable when storage client is missing', async () => {
    mockUseStorageCapableClient.mockReturnValue(null);
    render(<JournalImageThumbnail imageId="img-3" alt="Missing client" />);
    await waitFor(() => {
      expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
    });
  });
});
