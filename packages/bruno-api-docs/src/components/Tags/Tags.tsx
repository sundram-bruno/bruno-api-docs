import React from 'react';
import { TagIcon } from '@/assets/icons';
import { StyledWrapper } from './StyledWrapper';

interface TagsProps {
  tags: string[];
  className?: string;
  testId?: string;
}

/** Chip list for an item's tags. Renders nothing when there are none. */
export const Tags: React.FC<TagsProps> = ({ tags, className, testId = 'tags' }) => {
  if (tags.length === 0) return null;

  return (
    <StyledWrapper className={className} data-testid={testId}>
      {tags.map((tag) => (
        <span key={tag} className="tag-chip" data-testid={`${testId}-chip`}>
          <TagIcon />
          <span className="tag-chip-label">{tag}</span>
        </span>
      ))}
    </StyledWrapper>
  );
};

export default Tags;
