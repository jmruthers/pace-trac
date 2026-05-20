import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvents, useToast } from '@solvera/pace-core/hooks';
import { useSecureSupabase, useStorageCapableClient } from '@solvera/pace-core/rbac';
import { useUnifiedAuthContext } from '@solvera/pace-core';
import { isErr } from '@solvera/pace-core/types';
import type {
  JournalPost,
  JournalPostInsert,
  JournalPostStatus,
  JournalPostUpdate,
} from '@/types/journal';
import {
  deleteJournalImage,
  JournalImageLifecycleError,
  removeStorageObjectsForPost,
  uploadJournalImage,
  type JournalDbClient,
  type JournalStorageClient,
} from '@/hooks/journal/journal-image-lifecycle';
import { validateJournalImageFile } from '@/utils/journal-storage';

function normalisePosts(rows: JournalPost[] | null): JournalPost[] {
  if (rows == null) return [];
  return rows.map((post) => ({
    ...post,
    trac_journal_images: post.trac_journal_images ?? [],
  }));
}

export function useJournalPosts() {
  const { user } = useUnifiedAuthContext();
  const { selectedEvent, isLoading: eventLoading } = useEvents();
  const secureSupabase = useSecureSupabase();
  const storageClient = useStorageCapableClient();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const eventId = selectedEvent?.id ?? '';
  const organisationId =
    typeof selectedEvent?.organisation_id === 'string' ? selectedEvent.organisation_id : '';
  const userId = user?.id ?? '';
  const journalQueryKey = useMemo(() => ['journal-posts', eventId] as const, [eventId]);

  const queryEnabled =
    Boolean(eventId && organisationId && userId && secureSupabase != null && !eventLoading);

  const {
    data: posts = [],
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: journalQueryKey,
    enabled: queryEnabled,
    queryFn: async (): Promise<JournalPost[]> => {
      const client = secureSupabase as {
        from: (table: string) => {
          select: (query: string) => {
            eq: (col: string, val: string) => {
              order: (col: string, opts: { ascending: boolean }) => Promise<{
                data: JournalPost[] | null;
                error: { message?: string } | null;
              }>;
            };
          };
        };
      };
      const { data, error } = await client
        .from('trac_journal_posts')
        .select('*, trac_journal_images(*)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error != null) {
        throw new Error(error.message ?? 'Failed to load journal posts.');
      }
      return normalisePosts(data as JournalPost[] | null);
    },
  });

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: journalQueryKey });
  }, [queryClient, journalQueryKey]);

  const uploadImagesForPost = useCallback(
    async (postId: string, files: File[], onProgress?: (percent: number) => void) => {
      if (storageClient == null) {
        throw new JournalImageLifecycleError('Storage is not available. Try again after signing in.');
      }
      const dbClient = secureSupabase as unknown as JournalDbClient;
      const storage = storageClient as unknown as JournalStorageClient;
      const errors: string[] = [];
      const total = files.length;

      for (let index = 0; index < total; index += 1) {
        const file = files[index]!;
        const validationError = validateJournalImageFile(file);
        if (validationError != null) {
          errors.push(`${file.name}: ${validationError}`);
          continue;
        }
        try {
          const uploadResult = await uploadJournalImage({
            dbClient,
            storageClient: storage,
            row: {
              post_id: postId,
              organisation_id: organisationId,
              created_by: userId,
            },
            file,
          });
          if (isErr(uploadResult)) {
            throw new JournalImageLifecycleError(uploadResult.error.message);
          }
        } catch (err) {
          const message =
            err instanceof JournalImageLifecycleError
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Upload failed.';
          errors.push(`${file.name}: ${message}`);
          continue;
        }
        onProgress?.(Math.round(((index + 1) / total) * 100));
      }

      if (errors.length > 0) {
        throw new JournalImageLifecycleError(errors.join(' '));
      }
    },
    [storageClient, secureSupabase, organisationId, userId]
  );

  const createPostMutation = useMutation({
    mutationFn: async (input: {
      title: string;
      content: string;
      status: JournalPostStatus;
      images: File[];
    }) => {
      if (secureSupabase == null || !userId || !eventId || !organisationId) {
        throw new Error('Journal is not ready. Select an event and try again.');
      }
      const row: JournalPostInsert = {
        event_id: eventId,
        organisation_id: organisationId,
        title: input.title.trim(),
        content: input.content,
        status: input.status,
        created_by: userId,
        updated_by: userId,
      };
      const client = secureSupabase as {
        from: (table: string) => {
          insert: (payload: JournalPostInsert) => {
            select: (cols: string) => {
              single: () => Promise<{
                data: JournalPost | null;
                error: { message?: string } | null;
              }>;
            };
          };
        };
      };
      const { data, error } = await client
        .from('trac_journal_posts')
        .insert(row)
        .select('*')
        .single();

      if (error != null || data == null) {
        throw new Error(error?.message ?? 'Failed to create journal post.');
      }

      if (input.images.length > 0) {
        setUploadProgress(0);
        await uploadImagesForPost(data.id, input.images, (percent) => setUploadProgress(percent));
      }
      return data as JournalPost;
    },
    onSuccess: async () => {
      setUploadProgress(null);
      await invalidate();
      toast({ title: 'Journal entry saved' });
    },
    onError: (error: Error) => {
      setUploadProgress(null);
      toast({
        title: 'Could not save journal entry',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async (input: {
      postId: string;
      title: string;
      content: string;
      status: JournalPostStatus;
      images: File[];
    }) => {
      if (secureSupabase == null || !userId) {
        throw new Error('Journal is not ready.');
      }
      const updates: JournalPostUpdate = {
        title: input.title.trim(),
        content: input.content,
        status: input.status,
        updated_by: userId,
      };
      const client = secureSupabase as {
        from: (table: string) => {
          update: (payload: JournalPostUpdate) => {
            eq: (col: string, val: string) => Promise<{ error: { message?: string } | null }>;
          };
        };
      };
      const { error } = await client
        .from('trac_journal_posts')
        .update(updates)
        .eq('id', input.postId);

      if (error != null) {
        throw new Error(error.message ?? 'Failed to update journal post.');
      }

      if (input.images.length > 0) {
        setUploadProgress(0);
        await uploadImagesForPost(input.postId, input.images, (percent) =>
          setUploadProgress(percent)
        );
      }
    },
    onSuccess: async () => {
      setUploadProgress(null);
      await invalidate();
      toast({ title: 'Journal entry updated' });
    },
    onError: (error: Error) => {
      setUploadProgress(null);
      toast({
        title: 'Could not update journal entry',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (post: JournalPost) => {
      if (secureSupabase == null) {
        throw new Error('Journal is not ready.');
      }
      const imageIds = (post.trac_journal_images ?? []).map((img) => img.id);
      if (imageIds.length > 0 && storageClient == null) {
        throw new JournalImageLifecycleError(
          'Storage is not available. Try again after signing in.'
        );
      }
      const client = secureSupabase as {
        from: (table: string) => {
          delete: () => {
            eq: (col: string, val: string) => Promise<{ error: { message?: string } | null }>;
          };
        };
      };
      const { error } = await client.from('trac_journal_posts').delete().eq('id', post.id);
      if (error != null) {
        throw new Error(error.message ?? 'Failed to delete journal post.');
      }

      if (imageIds.length > 0) {
        const cleanup = await removeStorageObjectsForPost(
          storageClient as unknown as JournalStorageClient,
          imageIds
        );
        if (!cleanup.ok) {
          throw new JournalImageLifecycleError(cleanup.error.message);
        }
        if (cleanup.data.failures.length > 0) {
          throw new JournalImageLifecycleError(
            'Post deleted but some images could not be removed from storage. Storage cleanup may be incomplete.'
          );
        }
      }
    },
    onSuccess: async () => {
      await invalidate();
      toast({ title: 'Journal entry deleted' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Could not delete journal entry',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      if (secureSupabase == null || storageClient == null) {
        throw new Error('Storage is not available.');
      }
      const deleteResult = await deleteJournalImage({
        dbClient: secureSupabase as unknown as JournalDbClient,
        storageClient: storageClient as unknown as JournalStorageClient,
        imageId,
      });
      if (isErr(deleteResult)) {
        throw new JournalImageLifecycleError(deleteResult.error.message);
      }
    },
    onSuccess: async () => {
      await invalidate();
      toast({ title: 'Image removed' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Could not remove image',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    posts,
    isLoading: isLoading || eventLoading,
    error: queryError instanceof Error ? queryError.message : null,
    refetch,
    createPost: createPostMutation.mutateAsync,
    updatePost: updatePostMutation.mutateAsync,
    deletePost: deletePostMutation.mutateAsync,
    deleteImage: deleteImageMutation.mutateAsync,
    isCreating: createPostMutation.isPending,
    isUpdating: updatePostMutation.isPending,
    isDeletingPost: deletePostMutation.isPending,
    isDeletingImage: deleteImageMutation.isPending,
    isMutating:
      createPostMutation.isPending ||
      updatePostMutation.isPending ||
      deletePostMutation.isPending ||
      deleteImageMutation.isPending,
    uploadProgress,
  };
}
