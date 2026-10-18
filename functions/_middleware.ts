export const onRequest: PagesFunction = async (context) => {
  const response = await context.next();
  const nonce = crypto.getRandomValues(new Uint8Array(16)).toHex();

  if (response.headers.get('Content-Type')?.includes('text/html')) {
    const text = (await response.text()).replaceAll('DUMMY_NONCE_VALUE', nonce);

    response.headers.set(
      'Content-Security-Policy',
      `default-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'none'; style-src 'self' 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-inline'; font-src 'self' https://assets.julian-scholz.dev; connect-src 'self'; img-src 'self' https://assets.julian-scholz.dev;`,
    );

    return new Response(text, response);
  }

  return response;
};
