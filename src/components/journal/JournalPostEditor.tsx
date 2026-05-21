import { useRef, useState } from 'react';
import {
  Button,
  Input,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@solvera/pace-core/components';
import { z } from '@solvera/pace-core/utils';
import type { JournalPost, JournalPostStatus } from '@/types/journal';
import { insertMarkdownWrapper } from '@/utils/journal-editor';

const journalFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  content: z.string().max(100_000, 'Content is too long'),
  status: z.enum(['draft', 'published']),
});

type JournalFormValues = z.infer<typeof journalFormSchema>;

export interface JournalPostSaveValues {
  title: string;
  content: string;
  status: JournalPostStatus;
  images: File[];
}

interface JournalPostEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: JournalPost | null;
  onSave: (values: JournalPostSaveValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  canDelete?: boolean;
  isSubmitting?: boolean;
  uploadProgress?: number | null;
}

export function JournalPostEditor({
  open,
  onOpenChange,
  post,
  onSave,
  onDelete,
  canDelete = false,
  isSubmitting = false,
  uploadProgress = null,
}: JournalPostEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingImages, setPendingImages] = useState<File[]>([]);

  const isEdit = post != null;
  const dialogTitle = isEdit ? 'Edit journal entry' : 'New journal entry';

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPendingImages([]);
    }
    onOpenChange(next);
  };

  const handleSubmit = async (values: JournalFormValues) => {
    await onSave({
      title: values.title,
      content: values.content,
      status: values.status,
      images: pendingImages,
    });
    setPendingImages([]);
    handleOpenChange(false);
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (files == null || files.length === 0) return;
    setPendingImages((prev) => [...prev, ...Array.from(files)]);
    if (fileInputRef.current != null) {
      fileInputRef.current.value = '';
    }
  };

  const applyMarkdown = (
    before: string,
    after: string,
    onChange: (value: string) => void,
    current: string
  ) => {
    const el = document.getElementById('journal-content') as HTMLTextAreaElement | null;
    const start = el?.selectionStart ?? current.length;
    const end = el?.selectionEnd ?? current.length;
    const { value, cursor } = insertMarkdownWrapper(current, start, end, before, after);
    onChange(value);
    requestAnimationFrame(() => {
      const textarea = document.getElementById('journal-content') as HTMLTextAreaElement | null;
      if (textarea != null) {
        textarea.focus();
        textarea.setSelectionRange(cursor, cursor);
      }
    });
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
                status: post?.status ?? 'published',
              }}
              onSubmit={handleSubmit}
            >
              {() => (
                <>
                  <FormField name="title" label="Title" required />
                  <FormField
                    name="status"
                    label="Status"
                    render={({ field }) => (
                      <Select
                        value={String(field.value ?? 'published')}
                        onValueChange={(value) =>
                          field.onChange((value ?? 'published') as JournalPostStatus)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FormField
                    name="content"
                    label="Content"
                    render={({ field }) => (
                      <>
                        <fieldset className="grid grid-flow-col auto-cols-max gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              applyMarkdown('**', '**', field.onChange, String(field.value ?? ''))
                            }
                          >
                            Bold
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              applyMarkdown('*', '*', field.onChange, String(field.value ?? ''))
                            }
                          >
                            Italic
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              applyMarkdown('\n## ', '\n', field.onChange, String(field.value ?? ''))
                            }
                          >
                            Heading
                          </Button>
                        </fieldset>
                        <Textarea
                          id="journal-content"
                          value={String(field.value ?? '')}
                          onChange={(value) => field.onChange(value)}
                          onBlur={field.onBlur}
                          rows={8}
                        />
                      </>
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
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
                      multiple
                      hidden
                      onChange={() =>
                        handleFilesSelected(fileInputRef.current?.files ?? null)
                      }
                    />
                  </Label>
                  {pendingImages.length > 0 && (
                    <ul>
                      {pendingImages.map((file) => (
                        <li key={`${file.name}-${file.size}`}>{file.name}</li>
                      ))}
                    </ul>
                  )}
                  {(uploadProgress != null || isSubmitting) && (
                    <Progress value={uploadProgress ?? undefined} />
                  )}
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
