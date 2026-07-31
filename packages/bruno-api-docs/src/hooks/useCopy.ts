import { useCallback, useEffect, useRef, useState } from 'react';

interface UseCopyArg {
  text?: string;
  getText?: () => string;
  disabled?: boolean;
  resetAfterMs?: number;
}

export const useCopy = ({ text, getText, disabled, resetAfterMs = 2000 }: UseCopyArg) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  useEffect(() => {
    setCopied((was) => (was ? false : was));
  }, [text, getText]);

  const copyResponse = useCallback(async () => {
    if (disabled || !navigator.clipboard) return;
    const value = getText ? getText() : text;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), resetAfterMs);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — fail silently.
    }
  }, [disabled, text, getText, resetAfterMs]);

  return { copied, copyResponse };
};

export default useCopy;
