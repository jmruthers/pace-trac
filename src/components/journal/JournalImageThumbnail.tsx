import { useEffect, useState } from 'react';
import { useStorageCapableClient } from '@solvera/pace-core/rbac';
import { LoadingSpinner } from '@solvera/pace-core/components';
import { JOURNAL_FILES_BUCKET, journalStorageObjectPath } from '@/utils/journal-storage';

const SIGNED_URL_TTL_SEC = 3600;

interface JournalImageThumbnailProps {
  imageId: string;
  alt: string;
}

export function JournalImageThumbnail({ imageId, alt }: JournalImageThumbnailProps) {
  const storageClient = useStorageCapableClient();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (storageClient == null) {
        if (!cancelled) {
          setUrl(null);
          setError('Image unavailable');
          setLoading(false);
        }
        return;
      }

      const path = journalStorageObjectPath(imageId);
      const bucket = storageClient.storage.from(JOURNAL_FILES_BUCKET);
      const signed = bucket.createSignedUrl?.(path, SIGNED_URL_TTL_SEC);

      if (signed == null) {
        if (!cancelled) {
          setUrl(null);
          setError('Image unavailable');
          setLoading(false);
        }
        return;
      }

      const result = await signed;
      if (cancelled) return;
      const signedUrl = result.data?.signedUrl ?? null;
      if (result.error != null || signedUrl == null) {
        setUrl(null);
        setError('Could not load image');
      } else {
        setUrl(signedUrl);
        setError(null);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [storageClient, imageId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error != null || url == null) {
    return <p>{error ?? 'Image unavailable'}</p>;
  }

  return <img src={url} alt={alt} />;
}
