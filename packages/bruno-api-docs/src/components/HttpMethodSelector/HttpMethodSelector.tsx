import React, { useCallback, useMemo, useState } from 'react';
import MenuDropdown from '../../ui/MenuDropdown';
import type { MenuDropdownItem } from '../../ui/MenuDropdown';
import { STANDARD_HTTP_METHODS } from '../../constants/request';
import { getMethodColorVar } from '../../theme/methodColors';
import { MethodBadge } from '../MethodBadge/MethodBadge';
import { StyledWrapper } from './StyledWrapper';

const ADD_CUSTOM_ITEM_ID = 'add-custom';

/** Width bounds for the custom-method input, in characters; the cap matches the app. */
const MIN_METHOD_WIDTH_CH = 4;
const MAX_METHOD_WIDTH_CH = 16;

interface HttpMethodSelectorProps {
  method: string;
  onMethodChange: (method: string) => void;
  testId?: string;
}

/**
 * The request method picker: the nine standard HTTP methods plus an "+ Add
 * Custom" row that swaps the trigger for an input, so readers can send methods
 * the list doesn't cover (PURGE, REPORT, …). Mirrors the app's selector.
 */
export const HttpMethodSelector: React.FC<HttpMethodSelectorProps> = ({ method, onMethodChange, testId }) => {
  const [isCustomMode, setIsCustomMode] = useState(false);
  // What is being typed, held here rather than pushed to the request on every
  // keystroke: a request cannot carry a half-typed or empty method (an empty one
  // reads back as GET), which would fight the field as the reader types.
  const [draftMethod, setDraftMethod] = useState('');

  const commitMethod = useCallback(
    (value: string) => {
      setIsCustomMode(false);
      onMethodChange(value);
    },
    [onMethodChange]
  );

  const startCustomMode = useCallback(() => {
    setDraftMethod('');
    setIsCustomMode(true);
  }, []);

  const handleCustomInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDraftMethod(event.target.value.toUpperCase());
  };

  const endCustomMode = () => {
    if (draftMethod) {
      commitMethod(draftMethod);
      return;
    }
    setIsCustomMode(false);
  };

  const handleCustomInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      endCustomMode();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setIsCustomMode(false);
    }
  };

  const items = useMemo<MenuDropdownItem[]>(
    () => [
      ...STANDARD_HTTP_METHODS.map((standardMethod) => ({
        id: standardMethod,
        label: <MethodBadge method={standardMethod} />,
        ariaLabel: standardMethod,
        onClick: () => commitMethod(standardMethod)
      })),
      {
        id: ADD_CUSTOM_ITEM_ID,
        label: '+ Add Custom',
        ariaLabel: 'Add custom method',
        className: 'dropdown-item-link',
        onClick: startCustomMode
      }
    ],
    [commitMethod, startCustomMode]
  );

  const selectedItemId = useMemo(() => {
    const normalized = method.toUpperCase();
    return STANDARD_HTTP_METHODS.includes(normalized) ? normalized : null;
  }, [method]);

  if (isCustomMode) {
    const widthCh = Math.min(Math.max(draftMethod.length + 1, MIN_METHOD_WIDTH_CH), MAX_METHOD_WIDTH_CH);

    return (
      <StyledWrapper>
        <input
          type="text"
          className="method-custom-input"
          style={{ width: `${widthCh}ch`, color: getMethodColorVar(draftMethod) }}
          value={draftMethod}
          onChange={handleCustomInputChange}
          onKeyDown={handleCustomInputKeyDown}
          onBlur={endCustomMode}
          aria-label="Custom HTTP method"
          title={draftMethod}
          data-testid={testId ? `${testId}-custom-input` : undefined}
          autoFocus
        />
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper>
      <MenuDropdown
        items={items}
        selectedItemId={selectedItemId}
        placement="bottom-start"
        role="listbox"
        size="sm"
        testId={testId}
      >
        <button type="button" className="method-select" aria-label="HTTP method" title={method}>
          <MethodBadge method={method} />
        </button>
      </MenuDropdown>
    </StyledWrapper>
  );
};

export default HttpMethodSelector;
