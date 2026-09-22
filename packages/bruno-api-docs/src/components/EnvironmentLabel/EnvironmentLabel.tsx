import React from 'react';
import { TruncatedText } from '@/components/TruncatedText/TruncatedText';
import { StyledWrapper } from './StyledWrapper';

interface EnvironmentLabelProps {
  name: string;
  color?: string;
  className?: string;
  nameClassName?: string;
  truncate?: boolean;
  testId?: string;
}

export const EnvironmentLabel: React.FC<EnvironmentLabelProps> = ({
  name,
  color,
  className,
  nameClassName,
  truncate = false,
  testId
}) => (
  <StyledWrapper className={['environment-label', className].filter(Boolean).join(' ')} data-testid={testId}>
    <span
      className={['environment-label-dot', color ? '' : 'environment-label-dot--empty'].filter(Boolean).join(' ')}
      style={color ? { background: color } : undefined}
    />
    {truncate ? (
      <TruncatedText
        text={name}
        className={['environment-label-name', 'environment-label-name--clamped', nameClassName]
          .filter(Boolean)
          .join(' ')}
      />
    ) : (
      <span className={['environment-label-name', nameClassName].filter(Boolean).join(' ')}>{name}</span>
    )}
  </StyledWrapper>
);

export default EnvironmentLabel;
