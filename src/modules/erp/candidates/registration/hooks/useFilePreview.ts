import { useCallback, useEffect, useState } from "react";

/**
 * Turns a File into a temporary blob URL for previewing.
 * The URL is revoked automatically so it never leaks memory.
 */
export function useFilePreviewUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}

/**
 * Remembers the last non-null file.
 *
 * The registration hook clears `visaUploadFile` after a successful upload;
 * this keeps the document visible for review until the form is reset.
 */
export function useLastFile(file: File | null) {
  const [lastFile, setLastFile] = useState<File | null>(null);

  useEffect(() => {
    if (file) setLastFile(file);
  }, [file]);

  const clear = useCallback(() => setLastFile(null), []);

  return [lastFile, clear] as const;
}
