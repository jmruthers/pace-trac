import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { JournalPostList } from '@/components/journal/JournalPostList';
import type { JournalPost } from '@/types/journal';

vi.mock('@/components/journal/JournalPostCard', () => ({
  JournalPostCard: ({ post }: { post: JournalPost }) => <article>{post.title}</article>,
}));

const post: JournalPost = {
  id: 'post-1',
  event_id: 'ev-1',
  organisation_id: 'org-1',
  title: 'Listed',
  content: 'Text',
  status: 'published',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  created_by: 'user-1',
  updated_by: 'user-1',
};

describe('JournalPostList', () => {
  afterEach(cleanup);

  it('shows empty state when there are no posts', () => {
    render(
      <JournalPostList
        posts={[]}
        canUpdate={false}
        canDelete={false}
        onEdit={vi.fn()}
        onDeletePost={vi.fn()}
        onDeleteImage={vi.fn()}
        isDeletingImage={false}
      />
    );
    expect(screen.getByText(/no journal entries yet/i)).toBeInTheDocument();
  });

  it('renders a card per post', () => {
    render(
      <JournalPostList
        posts={[post]}
        canUpdate
        canDelete
        onEdit={vi.fn()}
        onDeletePost={vi.fn()}
        onDeleteImage={vi.fn()}
        isDeletingImage={false}
      />
    );
    expect(screen.getByText('Listed')).toBeInTheDocument();
  });
});
