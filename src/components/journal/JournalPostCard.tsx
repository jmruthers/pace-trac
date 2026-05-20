import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@solvera/pace-core/components';
import type { JournalPost } from '@/types/journal';
import { formatJournalContentForDisplay } from '@/utils/journal-content';
import { JournalImageThumbnail } from '@/components/journal/JournalImageThumbnail';

interface JournalPostCardProps {
  post: JournalPost;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (post: JournalPost) => void;
  onDeletePost: (post: JournalPost) => void;
  onDeleteImage: (imageId: string) => void;
  isDeletingPost?: boolean;
  isDeletingImage: boolean;
}

export function JournalPostCard({
  post,
  canUpdate,
  canDelete,
  onEdit,
  onDeletePost,
  onDeleteImage,
  isDeletingPost = false,
  isDeletingImage,
}: JournalPostCardProps) {
  const paragraphs = formatJournalContentForDisplay(post.content);
  const images = post.trac_journal_images ?? [];

  return (
    <article>
      <Card>
        <CardHeader>
          <CardTitle>{post.title}</CardTitle>
          {(canUpdate || canDelete) && (
            <fieldset className="grid grid-flow-col auto-cols-max justify-end gap-2">
              {canUpdate && (
                <Button type="button" variant="outline" onClick={() => onEdit(post)}>
                  Edit
                </Button>
              )}
              {canDelete && !canUpdate && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isDeletingPost}
                  onClick={() => onDeletePost(post)}
                >
                  Delete entry
                </Button>
              )}
            </fieldset>
          )}
        </CardHeader>
        <CardContent>
          {paragraphs.length === 0 ? (
            <p>No content</p>
          ) : (
            paragraphs.map((block, index) => <p key={`${post.id}-p-${index}`}>{block}</p>)
          )}
        </CardContent>
        {images.length > 0 && (
          <CardFooter className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((image) => (
              <section key={image.id} className="grid gap-2">
                <JournalImageThumbnail
                  key={image.id}
                  imageId={image.id}
                  alt={`Attachment for ${post.title}`}
                />
                {canDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isDeletingImage}
                    onClick={() => onDeleteImage(image.id)}
                  >
                    Remove image
                  </Button>
                )}
              </section>
            ))}
          </CardFooter>
        )}
      </Card>
    </article>
  );
}
