import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.toml' },
      // The tests pass their own next(), so the static assets are never served
      miniflare: {
        serviceBindings: {
          ASSETS: () => new Response(null, { status: 404 }),
        },
      },
    }),
  ],
  test: {
    include: ['test/**/*.test.ts'],
  },
});
