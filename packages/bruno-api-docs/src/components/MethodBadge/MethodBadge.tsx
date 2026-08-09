import React from 'react';
import cx from '../../utils/cx';
import { getMethodColorVar } from '../../theme/methodColors';
import { StyledWrapper } from './StyledWrapper';

interface MethodBadgeProps {
  method: string;
  className?: string;
  asWritten?: boolean;
}

export const MethodBadge: React.FC<MethodBadgeProps> = ({ method, className, asWritten = false }) => {
  const resolvedMethod = method || 'GET';

  return (
    <StyledWrapper
      className={cx('method-badge', { 'method-badge--as-written': asWritten }, className)}
      style={{ color: getMethodColorVar(method) }}
    >
      {asWritten ? resolvedMethod : resolvedMethod.toUpperCase()}
    </StyledWrapper>
  );
};

export default MethodBadge;
