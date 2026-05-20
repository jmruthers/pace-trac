import { useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  Form,
  FormField,
  Label,
  Progress,
  SaveActions,
  Textarea,
} from '@solvera/pace-core/components';
import { z } from '@solvera/pace-core/utils';
import type { JournalPost } from '@/types/journal';

const journalFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  content: z.string().max(100_000, 'Content is too long'),
});

type JournalFormValues = z.infer<typeof journalFormSchema>;

interface JournalPostEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: JournalPost | null;
  onSave: (values: { title: string; content: string; images: File[] }) => Promise<void>;
  onDelete?: () => Promise<void>;
  canDelete?: boolean;
  isSubmitting?: boolean;
}

export function JournalPostEditor({
  open,
  onOpenChange,
  post,
  onSave,
  onDelete,
  canDelete = false,
  isSubmitting = false,
}: JournalPostEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const isEdit = post != null;
  const dialogTitle = isEdit ? 'Edit journal entry' : 'New journal entry';

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPendingImages([]);
      setUploadProgress(null);
    }
    onOpenChange(next);
  };

  const handleSubmit = async (values: JournalFormValues) => {
    setUploadProgress(pendingImages.length > 0 ? 10 : null);
    try {
      await onSave({
        title: values.title,
        content: values.content,
        images: pendingImages,
      });
      setPendingImages([]);
      setUploadProgress(null);
      handleOpenChange(false);
    } catch {
      setUploadProgress(null);
    }
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (files == null || files.length === 0) return;
    setPendingImages((prev) => [...prev, ...Array.from(files)]);
    if (fileInputRef.current != null) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Form<JournalFormValues>
              key={post?.id ?? 'new-entry'}
              schema={journalFormSchema}
              defaultValues={{
                title: post?.title ?? '',
                content: post?.content ?? '',
              }}
              onSubmit={handleSubmit}
            >
              {() => (
                <>
                  <FormField name="title" label="Title" required />
                  <FormField
                    name="content"
                    label="Content"
                    render={({ field }) => (
                      <Textarea
                        id="journal-content"
                        value={String(field.value ?? '')}
                        onChange={(value) => field.onChange(value)}
                        onBlur={field.onBlur}
                        rows={8}
                      />
                    )}
                  />
                  <Label>
                    Images
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose images
                    </Button>
                    {/* File picker requires native change event with FileList; pace-core Input is string-only. */}
                    {/* eslint-disable-next-line pace-core-compliance/prefer-pace-core-components -- file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
                      multiple
                      hidden
                      onChange={(event) => handleFilesSelected(event.target.files)}
                    />
                  </Label>
                  {pendingImages.length > 0 && (
                    <ul>
                      {pendingImages.map((file) => (
                        <li key={`${file.name}-${file.size}`}>{file.name}</li>
                      ))}
                    </ul>
                  )}
                  {uploadProgress != null && <Progress value={uploadProgress} />}
                  <DialogFooter>
                    <SaveActions
                      saveType="submit"
                      saveDisabled={isSubmitting}
                      onCancel={() => handleOpenChange(false)}
                      alternateActions={
                        isEdit && canDelete && onDelete != null ? (
                          <Button
                            type="button"
                            variant="destructive"
                            disabled={isSubmitting}
                            onClick={() => void onDelete()}
                          >
                            Delete
                          </Button>
                        ) : undefined
                      }
                    />
                  </DialogFooter>
                </>
              )}
            </Form>
          </DialogBody>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
