import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const returnFocusToTrigger = useRef(false);
  const displayMethod = (method || 'GET').toUpperCase();

  // Leaving custom entry unmounts the input, which would drop focus to the body
  // and strand a keyboard reader, so hand it back to the trigger that replaces it.
  useEffect(() => {
    if (!isCustomMode && returnFocusToTrigger.current) {
      returnFocusToTrigger.current = false;
      triggerRef.current?.focus();
    }
  }, [isCustomMode]);

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

  /**
   * `restoreFocus` only for keyboard exits: a pointer exit has already chosen
   * where focus goes, and pulling it back to the trigger would fight the reader.
   */
  const exitCustomMode = (restoreFocus: boolean) => {
    returnFocusToTrigger.current = restoreFocus;
    const typed = draftMethod.trim();
    if (typed) {
      commitMethod(typed);
      return;
    }
    setIsCustomMode(false);
  };

  const handleCustomInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      // Without this the same keypress reaches the trigger that replaces this
      // input once focus moves back to it, re-opening the menu.
      event.preventDefault();
      event.stopPropagation();
      exitCustomMode(true);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      returnFocusToTrigger.current = true;
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

  const selectedItemId = useMemo(
    () => (STANDARD_HTTP_METHODS.includes(displayMethod) ? displayMethod : null),
    [displayMethod]
  );

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
          onBlur={() => exitCustomMode(false)}
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
        <button
          ref={triggerRef}
          type="button"
          className="method-select"
          aria-label={`HTTP method: ${displayMethod}`}
          title={displayMethod}
        >
          <MethodBadge method={method} />
        </button>
      </MenuDropdown>
    </StyledWrapper>
  );
};

export default HttpMethodSelector;
