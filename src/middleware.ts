import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  (context.locals as any).runtime = { env: {} };
  return next();
});
