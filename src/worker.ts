// Custom Worker entry: Astro handles every request, and the cron in wrangler.jsonc rebuilds the
// station map and the conditions board every five minutes.
import { handle } from '@astrojs/cloudflare/handler';
import { refreshCategories } from './lib/refresh-data';

interface WorkerEnv {
  DATA?: Parameters<typeof refreshCategories>[0];
}

export default {
  async fetch(request: Request, env: WorkerEnv, context: ExecutionContext) {
    return handle(request, env as never, context);
  },
  async scheduled(_event: ScheduledEvent, env: WorkerEnv, context: ExecutionContext) {
    if (!env.DATA) return;
    context.waitUntil(
      refreshCategories(env.DATA)
        .then(({ stations }) => console.log(`categories: ${stations} stations`))
        .catch((error) => console.error('categories refresh failed:', error)),
    );
  },
} satisfies ExportedHandler<WorkerEnv>;
