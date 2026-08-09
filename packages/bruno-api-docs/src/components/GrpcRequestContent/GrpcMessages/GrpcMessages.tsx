import React, { useState } from 'react';
import type { GrpcMessageEntry } from '../../../utils/schemaHelpers';
import { GrpcMessageCard } from './GrpcMessageCard/GrpcMessageCard';
import { ExpandToggle } from '../../ExpandToggle/ExpandToggle';
import { StyledWrapper } from './StyledWrapper';

const COLLAPSED_COUNT = 3;

interface GrpcMessagesProps {
  messages: GrpcMessageEntry[];
  testId?: string;
}

export const GrpcMessages: React.FC<GrpcMessagesProps> = ({ messages, testId = 'grpc-messages' }) => {
  const [expandedIndexes, setExpandedIndexes] = useState<Set<number>>(() => new Set([0]));
  const [showAll, setShowAll] = useState(false);

  if (messages.length === 0) return null;

  const visible = showAll ? messages : messages.slice(0, COLLAPSED_COUNT);
  const hasOverflow = messages.length > COLLAPSED_COUNT;

  const toggle = (index: number) => {
    setExpandedIndexes((previous) => {
      const next = new Set(previous);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <StyledWrapper className="grpc-messages" data-testid={testId}>
      {visible.map((entry, index) => (
        <GrpcMessageCard
          key={`${entry.title}-${index}`}
          title={entry.title}
          message={entry.message}
          expanded={expandedIndexes.has(index)}
          onToggle={() => toggle(index)}
          testId={`${testId}-card-${index}`}
        />
      ))}

      {hasOverflow && (
        <ExpandToggle
          expanded={showAll}
          moreLabel="Show more"
          lessLabel="Show less"
          onToggle={() => setShowAll((value) => !value)}
          className="grpc-messages-show-toggle"
          testId={`${testId}-show-toggle`}
        />
      )}
    </StyledWrapper>
  );
};

export default GrpcMessages;
