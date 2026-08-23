import * as crypto from 'node:crypto';

export const onRequest: PagesFunction = async (context) => {
  const response = await context.next();
  const nonce = crypto.randomBytes(16).toHex();

  if (response.headers.get('Content-Type')?.includes('text/html')) {
    let text = await response.text();
    text = text.replace(/nonce="DUMMY_NONCE_VALUE"/g, `nonce="${nonce}"`);

    response.headers.set(
      'Content-Security-Policy',
      `default-src 'none'; base-uri 'self'; style-src 'self' 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-inline'; font-src 'self' https://assets.julian-scholz.dev; connect-src 'self'; img-src 'self' https://assets.julian-scholz.dev;`,
    );

    return new Response(text, response);
  }

  return response;
};
