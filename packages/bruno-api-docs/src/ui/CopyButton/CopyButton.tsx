import React from 'react';
import { baseIconProps } from '../../assets/icons/baseIconProps';
import { useCopy } from '../../hooks/useCopy';
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

const CheckGlyph: React.FC<{ testId?: string }> = ({ testId }) => (
  <svg {...glyphProps} data-testid={testId}>
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
  const { copied, copyResponse } = useCopy({ text, getText, resetAfterMs });

  return (
    <StyledWrapper
      type="button"
      className={['copy-button', className].filter(Boolean).join(' ')}
      onClick={copyResponse}
      aria-label={copied ? copiedLabel : label}
      data-copied={copied ? 'true' : undefined}
      data-testid={testId}
      style={style}
    >
      {copied ? <CheckGlyph testId={testId ? `${testId}-tick` : undefined} /> : <CopyGlyph />}
    </StyledWrapper>
  );
};

export default CopyButton;
