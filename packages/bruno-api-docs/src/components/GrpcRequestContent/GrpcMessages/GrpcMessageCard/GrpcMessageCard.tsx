import React, { useEffect, useId, useRef, useState } from 'react';
import cx from '@/utils/cx';
import { prefersReducedMotion } from '@/utils/motion';
import { ChevronArrow } from '../../../ChevronArrow/ChevronArrow';
import { Code } from '../../../Code/Code';
import { StyledWrapper } from './StyledWrapper';

interface GrpcMessageCardProps {
  title: string;
  message: string;
  expanded: boolean;
  onToggle: () => void;
  testId?: string;
}

const COLLAPSE_MS = 220;

export const GrpcMessageCard: React.FC<GrpcMessageCardProps> = ({
  title,
  message,
  expanded,
  onToggle,
  testId = 'grpc-message-card'
}) => {
  const [collapsing, setCollapsing] = useState(false);
  const timerRef = useRef(0);
  const detailId = useId();

  const isOpen = expanded && !collapsing;

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const finishCollapse = () => {
    window.clearTimeout(timerRef.current);
    setCollapsing(false);
    onToggle();
  };

  const handleToggle = () => {
    if (collapsing) {
      window.clearTimeout(timerRef.current);
      setCollapsing(false);
      return;
    }
    if (!expanded || prefersReducedMotion()) {
      onToggle();
      return;
    }
    setCollapsing(true);
    timerRef.current = window.setTimeout(finishCollapse, COLLAPSE_MS + 60);
  };

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (!collapsing) return;
    if (event.propertyName !== 'grid-template-rows') return;
    if (event.target !== event.currentTarget) return;
    finishCollapse();
  };

  return (
    <StyledWrapper className="grpc-message-card" data-testid={testId}>
      <div className="grpc-message-summary">
        <button
          type="button"
          className="grpc-message-toggle"
          aria-expanded={isOpen}
          aria-controls={detailId}
          data-testid={`${testId}-toggle`}
          onClick={handleToggle}
        >
          <ChevronArrow open={isOpen} size={14} className="grpc-message-chevron" />
          <span className="grpc-message-title" data-testid={`${testId}-title`}>{title}</span>
        </button>
      </div>

      <div className={cx('grpc-message-detail', { 'is-open': isOpen })} onTransitionEnd={handleTransitionEnd}>
        <div className="grpc-message-detail-clip">
          {expanded && (
            <div className="grpc-message-detail-body" id={detailId}>
              <Code code={message} language="json" showLineNumbers variableAware testId={`${testId}-code`} />
            </div>
          )}
        </div>
      </div>
    </StyledWrapper>
  );
};

export default GrpcMessageCard;
