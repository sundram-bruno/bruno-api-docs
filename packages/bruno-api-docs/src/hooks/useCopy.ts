import { useCallback, useEffect, useRef, useState } from 'react';

interface UseCopyArg {
  text?: string;
  getText?: () => string;
  disabled?: boolean;
  resetAfterMs?: number;
}

/**
 * Clipboard copying for a control that confirms the copy for a moment
 * afterwards, usually by swapping its icon for a tick.
 *
 * Pass `text` for a value that is already to hand, or `getText` for one that
 * has to be produced at click time, such as a large response body. `getText`
 * should be a stable reference, so wrap it in `useCallback`.
 *
 * A copy that fails, which happens when the page is not in a secure context,
 * leaves `copied` false rather than throwing.
 */
export const useCopy = ({ text, getText, disabled, resetAfterMs = 2000 }: UseCopyArg) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  // Drop the confirmation as soon as the value changes, so it can never vouch
  // for text other than the text that was copied.
  useEffect(() => {
    setCopied(false);
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
