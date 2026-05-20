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
    setLoading(true);
    setError(null);
    setUrl(null);

    if (storageClient == null) {
      setError('Image unavailable');
      setLoading(false);
      return;
    }

    const path = journalStorageObjectPath(imageId);
    const bucket = storageClient.storage.from(JOURNAL_FILES_BUCKET);
    const signed = bucket.createSignedUrl?.(path, SIGNED_URL_TTL_SEC);

    if (signed == null) {
      setError('Image unavailable');
      setLoading(false);
      return;
    }

    void signed.then((result) => {
      if (cancelled) return;
      const signedUrl = result.data?.signedUrl ?? null;
      if (result.error != null || signedUrl == null) {
        setError('Could not load image');
      } else {
        setUrl(signedUrl);
      }
      setLoading(false);
    });

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
