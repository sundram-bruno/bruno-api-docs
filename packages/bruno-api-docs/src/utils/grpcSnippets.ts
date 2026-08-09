import type { GrpcMetadata, GrpcMethodType } from '@opencollection/types/requests/grpc';
import type { GrpcMessageEntry } from './schemaHelpers';

export interface GrpcSnippetInput {
  url: string;
  method: string;
  methodType?: GrpcMethodType;
  protoFilePath?: string;
  metadata: GrpcMetadata[];
  messages: GrpcMessageEntry[];
  /** What `url` resolves to, when a variable hides the scheme. Decides TLS only; never shown. */
  resolvedUrl?: string;
}

const SCHEME_PATTERN = /^(grpcs?|https?):\/\//i;

const schemeOf = (value: string): string | undefined => value.trim().match(SCHEME_PATTERN)?.[1]?.toLowerCase();

/**
 * The target is emitted as written, so a `{{host}}` stays a variable the reader can hover.
 * TLS is a different question: it is decided here and never displayed, so it reads the
 * resolved value when the scheme sits inside the variable. Guessing plaintext there makes
 * grpcurl hang against a TLS server until it times out, blaming the network.
 */
const parseTarget = (url: string, resolvedUrl?: string): { target: string; plaintext: boolean } => {
  const trimmed = url.trim();
  const scheme = schemeOf(trimmed) ?? schemeOf(resolvedUrl ?? '');
  const plaintext = !scheme || scheme === 'grpc' || scheme === 'http';
  return { target: trimmed.replace(SCHEME_PATTERN, ''), plaintext };
};

/** `/pkg.Service/Method` as grpcurl and the docs page both want it, without the leading slash. */
export const grpcMethodPath = (method: string): string => method.replace(/^\//, '');

const parseProtoFlags = (protoFilePath: string): string[] => {
  const normalised = protoFilePath.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
  const lastSlash = normalised.lastIndexOf('/');
  const file = lastSlash === -1 ? normalised : normalised.slice(lastSlash + 1);
  // An absolute path keeps its root: slicing to index 0 would drop the leading slash.
  const dir = lastSlash === -1 ? '' : normalised.slice(0, lastSlash) || '/';
  return dir ? [`-import-path ${shellQuote(dir)}`, `-proto ${shellQuote(file)}`] : [`-proto ${shellQuote(file)}`];
};

const streamsInFor = (methodType?: GrpcMethodType): boolean =>
  methodType === 'client-streaming' || methodType === 'bidi-streaming';

const streamsOutFor = (methodType?: GrpcMethodType): boolean =>
  methodType === 'server-streaming' || methodType === 'bidi-streaming';

const parseService = (method: string): { servicePath: string; methodName: string } => {
  const trimmed = grpcMethodPath(method);
  const slash = trimmed.lastIndexOf('/');
  if (slash === -1) return { servicePath: '', methodName: trimmed };
  return { servicePath: trimmed.slice(0, slash), methodName: trimmed.slice(slash + 1) };
};

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const IDENTIFIER_PATH = /^[A-Za-z_$][A-Za-z0-9_$]*(\.[A-Za-z_$][A-Za-z0-9_$]*)*$/;

/**
 * A heredoc ends at the first line equal to its delimiter, so a message containing a bare
 * `EOF` line would close it early and hand the rest to the shell. Pick one no message uses.
 */
const heredocDelimiter = (messages: string[]): string => {
  const lines = new Set(messages.flatMap((message) => message.split('\n').map((line) => line.trim())));
  let delimiter = 'EOF';
  for (let suffix = 2; lines.has(delimiter); suffix += 1) delimiter = `EOF${suffix}`;
  return delimiter;
};

const shellQuote = (value: string): string => `'${value.replace(/'/g, `'\\''`)}'`;

const jsQuote = (value: string): string =>
  `'${value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\r/g, '\\r').replace(/\n/g, '\\n')}'`;

const indent = (text: string, spaces: number): string =>
  text
    .split('\n')
    .map((line, index) => (index === 0 ? line : `${' '.repeat(spaces)}${line}`))
    .join('\n');

export const generateGrpcurlCommand = ({
  url,
  method,
  methodType,
  protoFilePath,
  metadata,
  messages,
  resolvedUrl
}: GrpcSnippetInput): string => {
  const { target, plaintext } = parseTarget(url, resolvedUrl);
  const parts: string[] = ['grpcurl'];

  if (plaintext) {
    parts.push('-plaintext');
  }

  for (const entry of metadata.filter((item) => !item.disabled)) {
    parts.push(`-H ${shellQuote(`${entry.name}: ${entry.value}`)}`);
  }

  if (protoFilePath) {
    parts.push(...parseProtoFlags(protoFilePath));
  }

  const streaming = streamsInFor(methodType);

  if (messages.length > 0) {
    parts.push(streaming ? '-d @' : `-d ${shellQuote(messages[0].message)}`);
  }

  parts.push(shellQuote(target));
  parts.push(shellQuote(grpcMethodPath(method)));

  const command = parts.join(' \\\n  ');

  if (streaming && messages.length > 0) {
    const bodies = messages.map((entry) => entry.message);
    const delimiter = heredocDelimiter(bodies);
    return `${command} << '${delimiter}'\n${bodies.join('\n')}\n${delimiter}`;
  }

  return command;
};

export const generateGrpcJavaScriptCode = ({
  url,
  method,
  methodType,
  protoFilePath,
  metadata,
  messages,
  resolvedUrl
}: GrpcSnippetInput): string => {
  const { servicePath, methodName } = parseService(method);
  // Both land in code positions a string cannot be escaped into, so anything that is not a
  // plain identifier path yields no snippet rather than a corrupted one.
  if (!protoFilePath || !IDENTIFIER_PATH.test(servicePath) || !IDENTIFIER.test(methodName)) return '';

  const { target, plaintext } = parseTarget(url, resolvedUrl);
  const enabled = metadata.filter((entry) => !entry.disabled);
  const credentials = plaintext ? 'grpc.credentials.createInsecure()' : 'grpc.credentials.createSsl()';

  const lines: string[] = [
    `const grpc = require('@grpc/grpc-js');`,
    `const protoLoader = require('@grpc/proto-loader');`,
    '',
    `const packageDefinition = protoLoader.loadSync(${jsQuote(protoFilePath)});`,
    'const proto = grpc.loadPackageDefinition(packageDefinition);',
    '',
    `const client = new proto.${servicePath}(${jsQuote(target)}, ${credentials});`
  ];

  if (enabled.length > 0) {
    lines.push('', 'const metadata = new grpc.Metadata();');
    enabled.forEach((entry) => lines.push(`metadata.set(${jsQuote(entry.name)}, ${jsQuote(entry.value)});`));
  }

  const metadataArg = enabled.length > 0 ? 'metadata' : '';
  const streamsIn = streamsInFor(methodType);
  const streamsOut = streamsOutFor(methodType);

  if (streamsIn) {
    lines.push('', 'const messages = [');
    messages.forEach((entry, index) => {
      const comma = index === messages.length - 1 ? '' : ',';
      lines.push(`  ${indent(entry.message, 2)}${comma}`);
    });
    lines.push('];');
  } else {
    lines.push('', `const message = ${messages.length > 0 ? messages[0].message : '{}'};`);
  }

  lines.push('');

  const callArgs = [streamsIn ? '' : 'message', metadataArg].filter(Boolean).join(', ');

  const withCallback = `${callArgs}${callArgs ? ', ' : ''}(error, response) => {`;

  if (!streamsOut) {
    // Unary and client-streaming both end in a single response, so both take a callback.
    const opening = streamsIn ? `const call = client.${methodName}(` : `client.${methodName}(`;
    lines.push(`${opening}${withCallback}`, '  console.log(error ?? response);', '});');
  } else {
    lines.push(`const call = client.${methodName}(${callArgs});`);
    lines.push(`call.on('data', (response) => console.log(response));`, `call.on('end', () => console.log('done'));`);
  }

  if (streamsIn) {
    lines.push('', 'for (const message of messages) {', '  call.write(message);', '}', 'call.end();');
  }

  return lines.join('\n');
};
