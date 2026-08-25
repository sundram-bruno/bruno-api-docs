import styled from '@emotion/styled';

export const StyledWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;

  .tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 28px;
    padding: 0 4px;
    box-sizing: border-box;
    border: 1px solid var(--oc-border-border0);
    border-radius: var(--oc-radius);
    font-family: var(--font-sans);
    font-size: 0.875rem;
    color: var(--oc-colors-text-subtext2);
  }

  .tag-chip svg {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    color: var(--oc-colors-text-subtext0);
  }

  .tag-chip-label {
    line-height: 1;
  }
`;
