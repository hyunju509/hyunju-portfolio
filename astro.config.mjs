import { defineConfig } from 'astro/config';
import { rm } from 'node:fs/promises';

/*
 * Internal development tooling routes (CMS comparison pages, asset review)
 * must not exist in the production static build — their source stays in
 * the repo for local use, but the emitted pages are removed after build so
 * direct production URLs return 404.
 */
const INTERNAL_ROUTES = ['cms-preview', 'asset-review'];

const pruneInternalRoutes = {
  name: 'prune-internal-routes',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      for (const route of INTERNAL_ROUTES) {
        await rm(new URL(`${route}/`, dir), { recursive: true, force: true });
        logger.info(`removed internal route /${route} from production output`);
      }
    },
  },
};

export default defineConfig({
  integrations: [pruneInternalRoutes],
});
