import React from 'react';
import { StyledWrapper } from './StyledWrapper';

interface ExpandToggleProps {
  expanded: boolean;
  moreLabel: string;
  lessLabel: string;
  onToggle: () => void;
  controls?: string;
  className?: string;
  testId?: string;
}

export const ExpandToggle: React.FC<ExpandToggleProps> = ({
  expanded,
  moreLabel,
  lessLabel,
  onToggle,
  controls,
  className,
  testId
}) => (
  <StyledWrapper
    type="button"
    className={['expand-toggle', className].filter(Boolean).join(' ')}
    aria-expanded={expanded}
    aria-controls={controls}
    data-testid={testId}
    onClick={onToggle}
  >
    <span>{expanded ? lessLabel : moreLabel}</span>
    <svg
      className="expand-toggle-chevron"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </StyledWrapper>
);

export default ExpandToggle;
