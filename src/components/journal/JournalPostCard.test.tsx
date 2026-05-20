import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { JournalPostCard } from '@/components/journal/JournalPostCard';
import type { JournalPost } from '@/types/journal';

vi.mock('@/components/journal/JournalImageThumbnail', () => ({
  JournalImageThumbnail: () => <img src="https://example.com/x" alt="thumb" />,
}));

const post: JournalPost = {
  id: 'post-1',
  event_id: 'ev-1',
  organisation_id: 'org-1',
  title: 'Day one',
  content: 'Sunny',
  status: 'published',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  created_by: 'user-1',
  updated_by: 'user-1',
  trac_journal_images: [
    {
      id: 'img-1',
      post_id: 'post-1',
      organisation_id: 'org-1',
      created_at: '2026-01-01',
      updated_at: null,
      created_by: 'user-1',
      updated_by: null,
    },
  ],
};

describe('JournalPostCard', () => {
  afterEach(cleanup);

  it('renders post title and edit control when permitted', () => {
    render(
      <JournalPostCard
        post={post}
        canUpdate
        canDelete
        onEdit={vi.fn()}
        onDeleteImage={vi.fn()}
        isDeletingImage={false}
      />
    );
    expect(screen.getByText('Day one')).toBeInTheDocument();
    expect(screen.getByText('Sunny')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove image/i })).toBeInTheDocument();
  });
});
