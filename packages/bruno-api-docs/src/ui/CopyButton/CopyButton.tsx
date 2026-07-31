import React, { useCallback, useEffect, useRef, useState } from 'react';
import { baseIconProps } from '../../assets/icons/baseIconProps';
import { StyledWrapper } from './StyledWrapper';

interface CopyButtonProps {
  text?: string;
  getText?: () => string;
  label?: string;
  copiedLabel?: string;
  resetAfterMs?: number;
  testId?: string;
  style?: React.CSSProperties;
  className?: string;
}

const glyphProps = { ...baseIconProps, width: '1em', height: '1em' };

const CopyGlyph: React.FC = () => (
  <svg {...glyphProps}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckGlyph: React.FC = () => (
  <svg {...glyphProps}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  getText,
  label = 'Copy',
  copiedLabel = 'Copied',
  resetAfterMs = 2000,
  testId = 'copy-button',
  style,
  className
}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  // A new value clears the tick, so it never claims success for text that was
  // not the text copied. `getText` is expected to be stable, as it already is
  // for the copy handler below.
  useEffect(() => {
    setCopied(false);
  }, [text, getText]);

  const handleCopy = useCallback(async () => {
    if (!navigator.clipboard) return;
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
  }, [text, getText, resetAfterMs]);

  return (
    <StyledWrapper
      type="button"
      className={['copy-button', className].filter(Boolean).join(' ')}
      onClick={handleCopy}
      aria-label={copied ? copiedLabel : label}
      data-copied={copied ? 'true' : undefined}
      data-testid={testId}
      style={style}
    >
      {copied ? <CheckGlyph /> : <CopyGlyph />}
    </StyledWrapper>
  );
};

export default CopyButton;
