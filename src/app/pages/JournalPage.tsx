import { useCallback, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  LoadingSpinner,
} from '@solvera/pace-core/components';
import { PagePermissionGuard, useResourcePermissions } from '@solvera/pace-core/rbac';
import type { JournalPost } from '@/types/journal';
import { JournalPostEditor } from '@/components/journal/JournalPostEditor';
import { JournalPostList } from '@/components/journal/JournalPostList';
import { useJournalPosts } from '@/hooks/journal/useJournalPosts';

function JournalPageContent() {
  const { canCreate, canUpdate, canDelete, isLoading: permissionsLoading } =
    useResourcePermissions('journal');
  const {
    posts,
    isLoading,
    error,
    createPost,
    updatePost,
    deletePost,
    deleteImage,
    isMutating,
    isDeletingImage,
  } = useJournalPosts();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<JournalPost | null>(null);

  const handleNewEntry = useCallback(() => {
    setEditingPost(null);
    setEditorOpen(true);
  }, []);

  const handleEdit = useCallback((post: JournalPost) => {
    setEditingPost(post);
    setEditorOpen(true);
  }, []);

  const handleSave = useCallback(
    async (values: { title: string; content: string; images: File[] }) => {
      if (editingPost != null) {
        await updatePost({
          postId: editingPost.id,
          title: values.title,
          content: values.content,
          images: values.images,
        });
      } else {
        await createPost(values);
      }
    },
    [createPost, updatePost, editingPost]
  );

  const handleDeletePost = useCallback(async () => {
    if (editingPost == null) return;
    await deletePost(editingPost);
    setEditorOpen(false);
    setEditingPost(null);
  }, [deletePost, editingPost]);

  if (isLoading || permissionsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <section className="grid gap-4">
      <header className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <section>
          <h1>Journal</h1>
          <p>Chronological record of this event with optional images.</p>
        </section>
        {canCreate && (
          <fieldset className="grid justify-items-end">
            <Button type="button" onClick={handleNewEntry}>
              New entry
            </Button>
          </fieldset>
        )}
      </header>

      {error != null && (
        <Alert variant="destructive">
          <AlertTitle>Could not load journal</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <JournalPostList
        posts={posts}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onEdit={handleEdit}
        onDeleteImage={(imageId) => void deleteImage(imageId)}
        isDeletingImage={isDeletingImage}
      />

      <JournalPostEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        post={editingPost}
        onSave={handleSave}
        onDelete={editingPost != null ? handleDeletePost : undefined}
        canDelete={canDelete}
        isSubmitting={isMutating}
      />
    </section>
  );
}

export function JournalPage() {
  return (
    <main>
      <PagePermissionGuard pageName="journal" operation="read">
        <JournalPageContent />
      </PagePermissionGuard>
    </main>
  );
}
