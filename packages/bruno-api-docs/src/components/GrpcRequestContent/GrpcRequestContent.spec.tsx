import React from 'react';
import { describe, it, expect } from 'vitest';
import { useRenderToDom } from '@/hooks/useRenderToDom';

const useMarkup = (element: React.ReactElement): string => useRenderToDom(element).innerHTML;
import type { GrpcRequest } from '@opencollection/types/requests/grpc';
import { GrpcRequestContent } from './GrpcRequestContent';

const grpcItem = (data: Record<string, unknown>): GrpcRequest => data as unknown as GrpcRequest;

describe('GrpcRequestContent', () => {
  it('renders the request name, the GRPC badge and the url', () => {
    const html = useMarkup(
      <GrpcRequestContent
        item={grpcItem({ info: { name: 'Order Service', type: 'grpc' }, grpc: { url: 'grpc://localhost:50051' } })}
      />
    );
    expect(html).toContain('Order Service');
    expect(html).toContain('gRPC');
    expect(html).toContain('grpc://localhost:50051');
  });

  it('renders a request that has no grpc block at all', () => {
    const html = useMarkup(
      <GrpcRequestContent item={grpcItem({ name: 'Bare Method', type: 'grpc', url: '{{grpcUrl}}' })} />
    );
    expect(html).toContain('Bare Method');
    expect(html).toContain('{{grpcUrl}}');
  });

  it('falls back to a placeholder name and never offers a Try button', () => {
    const html = useMarkup(<GrpcRequestContent item={grpcItem({ info: { type: 'grpc' }, grpc: {} })} />);
    expect(html).toContain('Untitled Request');
    expect(html).not.toContain('Try</button>');
  });

  it('renders the docs markdown as html', () => {
    const html = useMarkup(
      <GrpcRequestContent
        item={grpcItem({
          info: { name: 'Order Service', type: 'grpc' },
          grpc: { url: 'grpc://localhost:50051' },
          docs: '# Order Service\n\nFetches a single order.'
        })}
      />
    );
    expect(html).toContain('markdown-documentation');
    expect(html).toContain('>Order Service</h1>');
    expect(html).toContain('<p>Fetches a single order.</p>');
  });

  it('omits the description block when there are no docs', () => {
    const html = useMarkup(
      <GrpcRequestContent item={grpcItem({ info: { name: 'Chat', type: 'grpc' }, grpc: {} })} />
    );
    expect(html).not.toContain('markdown-documentation');
  });

  it('renders a request with a method', () => {
    const html = useMarkup(
      <GrpcRequestContent item={grpcItem({ info: { name: 'Test Request', type: 'grpc' }, grpc: { method: 'GetOrder' } })} />
    );
    expect(html).toContain('GetOrder');
  });

  it('renders the proto file name and the method with its type label', () => {
    const html = useMarkup(
      <GrpcRequestContent
        item={grpcItem({
          info: { name: 'Get Book', type: 'grpc' },
          grpc: {
            url: 'grpc://localhost:9000',
            protoFilePath: 'book.proto',
            method: '/com.bookstore.BookService/GetBook',
            methodType: 'unary'
          }
        })}
      />
    );
    expect(html).toContain('book.proto');
    expect(html).toContain('>com.bookstore.BookService/GetBook<');
    expect(html).toContain('Unary');
  });

  it('hides the proto file path when the request uses reflection', () => {
    const html = useMarkup(
      <GrpcRequestContent
        item={grpcItem({
          info: { name: 'Get Book', type: 'grpc' },
          grpc: {
            url: 'grpc://localhost:50051',
            method: '/hello.HelloService/BidiHello',
            methodType: 'bidi-streaming'
          }
        })}
      />
    );
    expect(html).not.toContain('grpc-request-section-proto-file');
    expect(html).toContain('Bidirectional Streaming');
  });

  it('hides the method section when no method is selected', () => {
    const html = useMarkup(
      <GrpcRequestContent item={grpcItem({ name: 'Bare Method', type: 'grpc', url: '{{grpcUrl}}' })} />
    );
    expect(html).not.toContain('grpc-request-section-method');
    expect(html).toContain('Bare Method');
  });

  it('renders metadata rows with their descriptions and counts only enabled ones', () => {
    const html = useMarkup(
      <GrpcRequestContent
        item={grpcItem({
          info: { name: 'Order Service', type: 'grpc' },
          grpc: {
            url: 'grpc://localhost:50051',
            method: '/orders.OrderService/GetOrder',
            metadata: [
              { name: 'authorization', value: 'Bearer token', description: 'Auth token' },
              { name: 'x-request-id', value: 'req-001' },
              { name: 'x-legacy-flag', value: 'off', disabled: true }
            ]
          }
        })}
      />
    );
    expect(html).toContain('authorization');
    expect(html).toContain('Auth token');
    expect(html).toContain('x-legacy-flag');
    expect(html).toContain('2 fields');
  });

  it('reads a metadata description given as an object', () => {
    const html = useMarkup(
      <GrpcRequestContent
        item={grpcItem({
          info: { name: 'Chat', type: 'grpc' },
          grpc: {
            url: 'grpc://localhost:50051',
            method: '/hello.HelloService/BidiHello',
            metadata: [{ name: 'x-client', value: 'Bruno', description: { content: 'Client name' } }]
          }
        })}
      />
    );
    expect(html).toContain('Client name');
    expect(html).toContain('1 field');
  });

  it('hides the metadata section when there is none', () => {
    const html = useMarkup(
      <GrpcRequestContent
        item={grpcItem({
          info: { name: 'Stream Replies', type: 'grpc' },
          grpc: { url: 'grpc://localhost:50051', method: '/hello.HelloService/LotsOfReplies' }
        })}
      />
    );
    expect(html).not.toContain('grpc-request-section-metadata');
  });

  it('shows concrete auth with no inherited badge', () => {
    const html = useMarkup(
      <GrpcRequestContent
        item={grpcItem({
          info: { name: 'Get Book', type: 'grpc' },
          grpc: {
            url: 'grpc://localhost:9000',
            method: '/com.book.BookService/GetBook',
            auth: { type: 'basic', username: 'reader', password: 's3cret' }
          }
        })}
      />
    );
    expect(html).toContain('Basic Auth');
    expect(html).toContain('reader');
    expect(html).not.toContain('Inherited from');
  });

  it('resolves inherited auth up to the collection and says where it came from', () => {
    const html = useMarkup(
      <GrpcRequestContent
        item={grpcItem({
          info: { name: 'Order Service', type: 'grpc' },
          grpc: { url: 'grpc://localhost:50051', method: '/orders.OrderService/GetOrder', auth: 'inherit' }
        })}
        collection={{ info: { name: 'Testbench' }, request: { auth: { type: 'bearer', token: 'abc' } } } as never}
      />
    );
    expect(html).toContain('Inherited from collection');
    expect(html).toContain('Bearer Token');
  });

  it('masks a secret rather than printing it', () => {
    const html = useMarkup(
      <GrpcRequestContent
        item={grpcItem({
          info: { name: 'Get Book', type: 'grpc' },
          grpc: {
            url: 'grpc://localhost:9000',
            method: '/com.book.BookService/GetBook',
            auth: { type: 'basic', username: 'reader', password: 's3cret' }
          }
        })}
      />
    );
    expect(html).not.toContain('s3cret');
  });

  it('hides the auth section when the request has no auth', () => {
    const html = useMarkup(
      <GrpcRequestContent
        item={grpcItem({
          info: { name: 'Chat', type: 'grpc' },
          grpc: { url: 'grpc://localhost:50051', method: '/hello.HelloService/BidiHello' }
        })}
      />
    );
    expect(html).not.toContain('grpc-request-section-auth');
  });

  it('shows a single empty state when the request has no configuration', () => {
    const html = useMarkup(
      <GrpcRequestContent item={grpcItem({ name: 'Bare Method', type: 'grpc', url: '{{grpcUrl}}' })} />
    );
    expect(html).toContain('grpc-request-config-empty');
    expect(html).toContain('No request configuration');
    expect(html).toContain('Bare Method');
  });

  it('builds a grpcurl snippet from the request', () => {
    const html = useMarkup(
      <GrpcRequestContent
        item={grpcItem({
          info: { name: 'Order Service', type: 'grpc' },
          grpc: {
            url: 'grpc://localhost:50051',
            method: '/orders.OrderService/GetOrder',
            methodType: 'unary',
            message: '{"orderId":"12345"}'
          }
        })}
      />
    );
    expect(html).toContain('grpcURL');
    expect(html).toContain('grpcurl');
    expect(html).toContain('localhost:50051');
    expect(html).toContain('orders.OrderService/GetOrder');
  });

  it('omits the code snippet when the request has no method', () => {
    const html = useMarkup(
      <GrpcRequestContent
        item={grpcItem({
          info: { name: 'Chat', type: 'grpc' },
          grpc: { url: 'grpc://localhost:50051', metadata: [{ name: 'x-client', value: 'Bruno' }] }
        })}
      />
    );
    expect(html).not.toContain('grpc-request-section-code-snippet');
  });

  it('shows sections instead of the empty state when there is any configuration', () => {
    const html = useMarkup(
      <GrpcRequestContent
        item={grpcItem({
          info: { name: 'Stream Replies', type: 'grpc' },
          grpc: { url: 'grpc://localhost:50051', method: '/hello.HelloService/LotsOfReplies' }
        })}
      />
    );
    expect(html).not.toContain('grpc-request-config-empty');
    expect(html).toContain('grpc-request-section-method');
  });

  it('offers a JavaScript snippet only when a proto file is attached', () => {
    const withProto = useMarkup(
      <GrpcRequestContent
        item={grpcItem({
          info: { name: 'Get Book', type: 'grpc' },
          grpc: {
            url: 'grpc://localhost:9000',
            method: '/com.book.BookService/GetBook',
            methodType: 'unary',
            protoFilePath: 'protos/book.proto'
          }
        })}
      />
    );
    expect(withProto).toContain('grpc-request-code-snippet-tab-javascript');

    const reflectionOnly = useMarkup(
      <GrpcRequestContent
        item={grpcItem({
          info: { name: 'Order Service', type: 'grpc' },
          grpc: { url: 'grpc://localhost:50051', method: '/orders.OrderService/GetOrder', methodType: 'unary' }
        })}
      />
    );
    expect(reflectionOnly).toContain('grpc-request-code-snippet-tab-grpcurl');
    expect(reflectionOnly).not.toContain('grpc-request-code-snippet-tab-javascript');
  });
});

describe('GrpcRequestContent — execution context', () => {
  const useWithRuntime = (runtime: Record<string, unknown>) =>
    useMarkup(
      <GrpcRequestContent
        item={grpcItem({
          info: { name: 'Order Service', type: 'grpc' },
          grpc: { url: 'grpc://localhost:50051', method: '/orders.OrderService/GetOrder' },
          runtime
        })}
      />
    );

  it('renders an empty state when the request carries no runtime', () => {
    const html = useMarkup(
      <GrpcRequestContent
        item={grpcItem({
          info: { name: 'Order Service', type: 'grpc' },
          grpc: { url: 'grpc://localhost:50051', method: '/orders.OrderService/GetOrder' }
        })}
      />
    );
    expect(html).toContain('grpc-request-section-execution-context');
    expect(html).toContain('grpc-request-execution-context-empty');
    expect(html).toContain('No execution context');
  });

  it('renders pre-request variables from the runtime block', () => {
    const html = useWithRuntime({ variables: [{ name: 'orderId', value: '12345' }] });
    expect(html).not.toContain('grpc-request-execution-context-empty');
    expect(html).toContain('orderId');
  });

  it('renders post-response captures stored as actions', () => {
    const html = useWithRuntime({
      actions: [
        {
          type: 'set-variable',
          trigger: 'after-response',
          variable: { name: 'lastOrderStatus', scope: 'runtime' },
          selector: { expression: 'res.body.status' }
        }
      ]
    });
    expect(html).not.toContain('grpc-request-execution-context-empty');
    expect(html).toContain('lastOrderStatus');
  });

  it('renders assertions from the runtime block', () => {
    const html = useWithRuntime({ assertions: [{ expression: 'res.body.orderId', operator: 'eq', value: '12345' }] });
    expect(html).not.toContain('grpc-request-execution-context-empty');
    expect(html).toContain('res.body.orderId');
  });

  it('renders scripts from the runtime block', () => {
    const html = useWithRuntime({ scripts: [{ type: 'before-request', code: 'bru.setVar(\'requestedAt\', Date.now());' }] });
    expect(html).not.toContain('grpc-request-execution-context-empty');
  });
});
