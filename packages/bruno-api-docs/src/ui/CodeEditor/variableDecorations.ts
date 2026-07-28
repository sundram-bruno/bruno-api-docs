import type { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { classifyVariableToken } from '../../utils/variableHighlight';

const TOKEN_REGEX = /\{\{[^}]+\}\}/g;

export interface VariableDecorator {
  refresh: () => void;
  dispose: () => void;
}

// Paints `{{var}}` tokens in a Monaco editor green/red by validity. `getIsFound` is read fresh on
// each paint, so `refresh()` re-classifies after an environment switch.
export const createVariableDecorator = (
  editorInstance: editor.IStandaloneCodeEditor,
  monaco: Monaco,
  getIsFound: () => (name: string) => boolean
): VariableDecorator => {
  const collection = editorInstance.createDecorationsCollection();

  const refresh = () => {
    const model = editorInstance.getModel();
    if (!model) return;
    const text = model.getValue();
    const isFound = getIsFound();
    const decorations: editor.IModelDeltaDecoration[] = [];
    TOKEN_REGEX.lastIndex = 0;
    for (let match = TOKEN_REGEX.exec(text); match; match = TOKEN_REGEX.exec(text)) {
      const inner = match[0].slice(2, -2);
      const start = model.getPositionAt(match.index);
      const end = model.getPositionAt(match.index + match[0].length);
      decorations.push({
        range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
        options: { inlineClassName: classifyVariableToken(inner, isFound) }
      });
    }
    collection.set(decorations);
  };

  const changeListener = editorInstance.onDidChangeModelContent(refresh);
  refresh();

  return {
    refresh,
    dispose: () => {
      changeListener.dispose();
      collection.clear();
    }
  };
};
