import React, { useLayoutEffect, useRef, useState } from 'react';
import { useResolvedVariables } from '../../hooks';
import { CopyButton } from '../../ui/CopyButton/CopyButton';
import { SCOPE_LABELS, INVALID_NAME_WARNING } from '../../constants';
import type { VariableScope } from '../../utils/variableResolution';
import { StyledWrapper } from './StyledWrapper';

const EDITABLE_SCOPES = new Set<VariableScope>(['environment', 'collection', 'folder', 'request']);

interface VariableInfoCardProps {
  name: string;
  editable?: boolean;
  testId?: string;
}

const getReadOnlyNote = (scope: VariableScope, activeEnvName: string | null): string | null => {
  if (scope === 'process.env' || scope === 'oauth2' || scope === '$secrets') return 'read-only';
  if (scope === 'undefined') return activeEnvName ? 'Variable is not defined' : 'No active environment';
  return null;
};

export const VariableInfoCard: React.FC<VariableInfoCardProps> = ({
  name,
  editable = false,
  testId = 'variable-info-card'
}) => {
  const { lookup, activeEnvName, updateVariable, canWrite } = useResolvedVariables();
  const info = lookup(name);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const editRef = useRef<HTMLTextAreaElement>(null);

  // Grow the edit field with its content; the container caps and scrolls it.
  useLayoutEffect(() => {
    const el = editRef.current;
    if (!editing || !el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [editing, draft]);

  const canEdit =
    editable &&
    canWrite &&
    info.valid &&
    !info.secret &&
    info.simpleString &&
    EDITABLE_SCOPES.has(info.scope) &&
    (info.scope !== 'environment' || !!activeEnvName);

  const startEditing = () => {
    // Edit the raw stored value (which may contain `{{refs}}`), not the deep-resolved display value.
    setDraft(info.rawValue);
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    if (draft !== info.rawValue) updateVariable(info.name, draft);
  };

  const handleEditKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setEditing(false);
    }
  };

  const header = (
    <div className="var-info-header">
      <span className="var-name" data-testid={`${testId}-name`}>
        {info.name}
      </span>
      <span className="var-scope-badge" data-testid={`${testId}-scope`}>
        {SCOPE_LABELS[info.scope]}
      </span>
    </div>
  );

  if (!info.valid) {
    return (
      <StyledWrapper className="variable-info-card" data-testid={testId}>
        {header}
        <div className="var-warning-note" data-testid={`${testId}-warning`}>
          {INVALID_NAME_WARNING}
        </div>
      </StyledWrapper>
    );
  }

  if (info.scope === 'dynamic') {
    if (info.dynamicKind === 'unknown') {
      return (
        <StyledWrapper className="variable-info-card" data-testid={testId}>
          {header}
          <div className="var-warning-note" data-testid={`${testId}-warning`}>
            {`Unknown dynamic variable "${info.name}". Check the variable name.`}
          </div>
        </StyledWrapper>
      );
    }
    return (
      <StyledWrapper className="variable-info-card" data-testid={testId}>
        {header}
        <div className="var-readonly-note" data-testid={`${testId}-note`}>
          {info.dynamicKind === 'time'
            ? 'Generates current timestamp on each request'
            : 'Generates random value on each request'}
        </div>
      </StyledWrapper>
    );
  }

  const readOnlyNote = getReadOnlyNote(info.scope, activeEnvName);
  const emptyLabel = info.value === '' ? '(empty)' : null;
  // An editable empty value keeps the clickable display rather than the plain placeholder.
  const placeholder = info.secret ? '(Secret)' : canEdit ? null : emptyLabel;

  const copyButton = (
    <div className="var-icons">
      <CopyButton
        text={info.value}
        label="Copy value"
        resetAfterMs={1000}
        className="copy-button"
        testId={`${testId}-copy`}
      />
    </div>
  );

  const placeholderNode = (
    <div className="var-value-display var-value-placeholder" data-testid={`${testId}-value`}>
      {placeholder}
    </div>
  );

  const editFieldNode = (
    <textarea
      ref={editRef}
      className="var-value-edit"
      data-testid={`${testId}-edit`}
      aria-label={`Edit ${info.name}`}
      value={draft}
      autoFocus
      rows={1}
      spellCheck={false}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={handleEditKeyDown}
      onBlur={commit}
    />
  );

  const editableDisplayNode = (
    <>
      <div
        className="var-value-display var-value-editable"
        data-testid={`${testId}-value`}
        role="button"
        tabIndex={0}
        title="Click to edit"
        // mousedown + preventDefault so the display swaps to the textarea without a focus-ring flash.
        onMouseDown={(event) => {
          event.preventDefault();
          startEditing();
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          startEditing();
        }}
      >
        {emptyLabel ?? info.value}
      </div>
      {copyButton}
    </>
  );

  const readOnlyDisplayNode = (
    <>
      <div className="var-value-display" data-testid={`${testId}-value`}>
        {info.value}
      </div>
      {copyButton}
    </>
  );

  const editableNode = editing ? editFieldNode : editableDisplayNode;
  const valueNode = placeholder ? placeholderNode : canEdit ? editableNode : readOnlyDisplayNode;

  return (
    <StyledWrapper className="variable-info-card" data-testid={testId}>
      {header}
      <div className="var-value-container">{valueNode}</div>
      {readOnlyNote && (
        <div className="var-readonly-note" data-testid={`${testId}-note`}>
          {readOnlyNote}
        </div>
      )}
    </StyledWrapper>
  );
};

export default VariableInfoCard;
