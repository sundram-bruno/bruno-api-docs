/// <reference types="vite/client" />

declare module 'atob/node-atob.js' {
  const atob: (input: string) => string;
  export default atob;
}
