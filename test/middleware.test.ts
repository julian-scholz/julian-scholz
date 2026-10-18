import { createPagesEventContext } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { onRequest } from '../functions/_middleware';

const getExpectedCsp = (nonce: string): string =>
  `default-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'none'; style-src 'self' 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-inline'; font-src 'self' https://assets.julian-scholz.dev; connect-src 'self'; img-src 'self' https://assets.julian-scholz.dev;`;

const html = `<!doctype html>
<html>
<head><style nonce="DUMMY_NONCE_VALUE"></style></head>
<body><app-root ngcspnonce="DUMMY_NONCE_VALUE"></app-root><script nonce="DUMMY_NONCE_VALUE"></script></body>
</html>`;

const runMiddleware = async (body: string, contentType: string): Promise<Response> =>
  onRequest(
    createPagesEventContext<typeof onRequest>({
      request: new Request<unknown, IncomingRequestCfProperties>('https://julian-scholz.dev/'),
      params: {},
      data: {},
      next: () => new Response(body, { headers: { 'Content-Type': contentType } }),
    }),
  );

const getNonce = (response: Response): string | undefined =>
  response.headers.get('Content-Security-Policy')?.match(/'nonce-([^']+)'/)?.[1];

describe('middleware', () => {
  it('sets the csp with the nonce that replaced the placeholder', async () => {
    const response = await runMiddleware(html, 'text/html; charset=utf-8');
    const nonce = getNonce(response);
    const body = await response.text();

    expect(nonce).toMatch(/^[0-9a-f]{32}$/);
    expect(response.headers.get('Content-Security-Policy')).toBe(getExpectedCsp(nonce!));
    expect(body).not.toContain('DUMMY_NONCE_VALUE');
    expect(body.match(/nonce="[^"]*"/g)).toEqual(Array(3).fill(`nonce="${nonce}"`));
  });

  it('creates a new nonce for every request', async () => {
    const [first, second] = await Promise.all([
      runMiddleware(html, 'text/html'),
      runMiddleware(html, 'text/html'),
    ]);

    expect(getNonce(first)).not.toBe(getNonce(second));
  });

  it('leaves responses other than html alone', async () => {
    const xml = '<?xml version="1.0"?><urlset nonce="DUMMY_NONCE_VALUE"/>';
    const response = await runMiddleware(xml, 'application/xml');

    expect(response.headers.get('Content-Security-Policy')).toBeNull();
    expect(await response.text()).toBe(xml);
  });
});
