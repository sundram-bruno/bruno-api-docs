import React, { useLayoutEffect, useRef, useState } from 'react';
import { useResolvedVariables } from '../../hooks';
import { CopyButton } from '../../ui/CopyButton/CopyButton';
import { EyeIcon, EyeOffIcon } from '../../assets/icons';
import { SCOPE_LABELS, INVALID_NAME_WARNING } from '../../constants';
import type { VariableScope } from '../../utils/variableResolution';
import { StyledWrapper } from './StyledWrapper';

const EDITABLE_SCOPES = new Set<VariableScope>(['environment', 'collection', 'folder', 'request', '$secrets']);

/** Scopes whose value the active environment supplies, so editing needs one selected. */
const ENV_BOUND_SCOPES = new Set<VariableScope>(['environment', '$secrets']);

interface VariableInfoCardProps {
  name: string;
  editable?: boolean;
  testId?: string;
}

/**
 * `$secrets` covers two things: a literal `{{$secrets.x}}` provider reference,
 * which nothing here can resolve, and an environment's declared external secret,
 * which the playground can fill in. Only the latter is editable.
 */
const getReadOnlyNote = (scope: VariableScope, activeEnvName: string | null, canEdit: boolean): string | null => {
  if (scope === 'process.env' || scope === 'oauth2') return 'read-only';
  if (scope === '$secrets' && !canEdit) return 'read-only';
  if (scope === 'undefined') return activeEnvName ? 'Variable is not defined' : 'No active environment';
  return null;
};

/** Masks per character so newlines survive and the mask lines up with the value. */
const maskValue = (value: string): string => value.replace(/[^\n]/g, '*');

export const VariableInfoCard: React.FC<VariableInfoCardProps> = ({
  name,
  editable = false,
  testId = 'variable-info-card'
}) => {
  const { lookup, activeEnvName, updateVariable, canWrite } = useResolvedVariables();
  const info = lookup(name);
  const [editing, setEditing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [draft, setDraft] = useState('');
  const editRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = editRef.current;
    if (!editing || !el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [editing, draft]);

  useLayoutEffect(() => {
    const el = editRef.current;
    if (!editing || !el) return;
    const end = el.value.length;
    el.setSelectionRange(end, end);
  }, [editing]);

  const canEdit
    = editable
      && canWrite
      && info.valid
      && info.simpleString
      && EDITABLE_SCOPES.has(info.scope)
      && (!ENV_BOUND_SCOPES.has(info.scope) || !!activeEnvName);

  // Docs keep the opaque "(Secret)" treatment; only the playground fills them in.
  const secretFillable = editable && info.secret;
  const masked = secretFillable && !revealed;
  const displayValue = masked ? maskValue(info.value) : info.value;

  const startEditing = () => {
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

  const readOnlyNote = getReadOnlyNote(info.scope, activeEnvName, canEdit);
  const emptyLabel = !secretFillable && info.value === '' ? '(empty)' : null;
  const placeholder = info.secret && !editable ? '(Secret)' : canEdit ? null : emptyLabel;

  const showCopy = info.value !== '' && !(info.secret && !editable);

  const icons = (showCopy || secretFillable) && (
    <div className="var-icons">
      {secretFillable && (
        <button
          type="button"
          className="reveal-button"
          aria-label={revealed ? 'Hide value' : 'Show value'}
          aria-pressed={revealed}
          data-testid={`${testId}-reveal`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setRevealed((previous) => !previous)}
        >
          {revealed ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      )}
      {showCopy && (
        <CopyButton
          text={info.value}
          label="Copy value"
          resetAfterMs={1000}
          className="copy-button"
          testId={`${testId}-copy`}
        />
      )}
    </div>
  );

  const placeholderNode = (
    <div className="var-value-display var-value-placeholder" data-testid={`${testId}-value`}>
      {placeholder}
    </div>
  );

  const editFieldNode = (
    <div className={`var-value-editor${masked ? ' var-value-editor--masked' : ''}`}>
      <div className="var-value-mirror" aria-hidden="true">
        {maskValue(draft)}
      </div>
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
    </div>
  );

  const editableDisplayNode = (
    <div
      className="var-value-display var-value-editable"
      data-testid={`${testId}-value`}
      role="button"
      tabIndex={0}
      title="Click to edit"
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
      {emptyLabel ?? displayValue}
    </div>
  );

  const readOnlyDisplayNode = (
    <div className="var-value-display" data-testid={`${testId}-value`}>
      {displayValue}
    </div>
  );

  const editableNode = editing ? editFieldNode : editableDisplayNode;
  const valueNode = placeholder ? placeholderNode : canEdit ? editableNode : readOnlyDisplayNode;

  return (
    <StyledWrapper className="variable-info-card" data-testid={testId}>
      {header}
      <div className="var-value-container">
        {valueNode}
        {icons}
      </div>
      {readOnlyNote && (
        <div className="var-readonly-note" data-testid={`${testId}-note`}>
          {readOnlyNote}
        </div>
      )}
    </StyledWrapper>
  );
};

export default VariableInfoCard;
