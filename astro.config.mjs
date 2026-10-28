import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  redirects: {
    '/course': '/learn',
    '/courses': '/learn',
    '/learn/notams': '/learn',
  },
});
