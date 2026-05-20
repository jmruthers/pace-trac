import type { JournalPost } from '@/types/journal';
import { JournalPostCard } from '@/components/journal/JournalPostCard';

interface JournalPostListProps {
  posts: JournalPost[];
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (post: JournalPost) => void;
  onDeletePost: (post: JournalPost) => void;
  onDeleteImage: (imageId: string) => void;
  isDeletingPost?: boolean;
  isDeletingImage: boolean;
}

export function JournalPostList({
  posts,
  canUpdate,
  canDelete,
  onEdit,
  onDeletePost,
  onDeleteImage,
  isDeletingPost = false,
  isDeletingImage,
}: JournalPostListProps) {
  if (posts.length === 0) {
    return (
      <section>
        <p>No journal entries yet. Create one to start documenting this event.</p>
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      {posts.map((post) => (
        <JournalPostCard
          key={post.id}
          post={post}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEdit={onEdit}
          onDeletePost={onDeletePost}
          onDeleteImage={onDeleteImage}
          isDeletingPost={isDeletingPost}
          isDeletingImage={isDeletingImage}
        />
      ))}
    </section>
  );
}
