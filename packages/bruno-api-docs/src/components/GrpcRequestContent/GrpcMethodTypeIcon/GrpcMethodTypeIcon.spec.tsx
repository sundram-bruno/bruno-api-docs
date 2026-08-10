import React from 'react';
import { describe, it, expect } from 'vitest';
import { useRenderToDom } from '@/hooks/useRenderToDom';
import { GrpcMethodTypeIcon } from './GrpcMethodTypeIcon';

const useColourOf = (methodType: string): string => {
  const root = useRenderToDom(<GrpcMethodTypeIcon methodType={methodType as never} />);
  return root.innerHTML;
};

describe('GrpcMethodTypeIcon', () => {
  it.each([
    ['unary', 'get'],
    ['server-streaming', 'put'],
    ['client-streaming', 'head'],
    ['bidi-streaming', 'post']
  ])('colours %s from the %s method variable', (methodType, token) => {
    expect(useColourOf(methodType)).toContain(`var(--oc-request-methods-${token})`);
  });

  it('renders nothing when the method type is absent', () => {
    const root = useRenderToDom(<GrpcMethodTypeIcon />);
    expect(root.querySelector('svg')).toBeNull();
  });

  it.each(['toString', 'constructor', 'hasOwnProperty', '__proto__'])(
    'renders nothing for a methodType named %s instead of crashing',
    (methodType) => {
      const root = useRenderToDom(<GrpcMethodTypeIcon methodType={methodType as never} />);
      expect(root.querySelector('svg')).toBeNull();
    }
  );
});
