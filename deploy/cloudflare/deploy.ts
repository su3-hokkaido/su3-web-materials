/**
 * Deploys dist/storybook (built by `pnpm run build-storybook:all`) to Cloudflare Workers Static
 * Assets (docs/project_plan.md sections 4 and 8). Called by .github/workflows/_deploy.yml;
 * switching to another cloud replaces this directory and that workflow.
 *
 * Usage: node deploy/cloudflare/deploy.ts <development|production>
 *   production  -> the Worker named CLOUDFLARE_WORKER_NAME
 *   development -> the persistent preview Worker `${CLOUDFLARE_WORKER_NAME}-dev`
 *
 * Environment: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_WORKER_NAME. When
 * GITHUB_OUTPUT is set, the deployed URL is written to it as `url`. This script changes remote
 * state: it is run by CI (or by the owner), never by Claude.
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseDeployOutput, readDeployConfig, type DeployResult } from './deploy-lib.ts';

const defaultRoot = resolve(import.meta.dirname, '../..');

export interface RunDeployOptions {
  /** Repository root: where `dist/storybook` and the Wrangler config are. */
  root?: string;
  env?: Readonly<Record<string, string | undefined>>;
  log?: (message: string) => void;
}

/** Runs the deploy and returns the result Wrangler reported, if any. Throws on any failure. */
export function runDeploy(
  args: readonly string[],
  options: RunDeployOptions = {},
): DeployResult | undefined {
  const root = options.root ?? defaultRoot;
  const env = options.env ?? process.env;
  const log = options.log ?? console.log;
  const config = readDeployConfig(args, env);

  const siteDir = join(root, 'dist/storybook');
  if (!existsSync(join(siteDir, 'index.html')) || !existsSync(join(siteDir, '_redirects'))) {
    throw new Error('dist/storybook is incomplete; run `pnpm run build-storybook:all` first.');
  }

  // Wrangler writes one JSON object per line here, including the deployment URL.
  const outputDir = mkdtempSync(join(tmpdir(), 'wrangler-output-'));
  const outputFile = join(outputDir, 'output.ndjson');
  try {
    log(`Deploying ${config.environment} to the Worker "${config.workerName}"`);
    const result = spawnSync(
      'pnpm',
      [
        'exec',
        'wrangler',
        'deploy',
        '--config',
        'deploy/cloudflare/wrangler.jsonc',
        '--name',
        config.workerName,
      ],
      {
        cwd: root,
        stdio: 'inherit',
        env: {
          ...process.env,
          ...env,
          CLOUDFLARE_API_TOKEN: config.apiToken,
          CLOUDFLARE_ACCOUNT_ID: config.accountId,
          WRANGLER_OUTPUT_FILE_PATH: outputFile,
        },
      },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(`wrangler deploy failed with exit code ${String(result.status)}.`);
    }

    const deployed = existsSync(outputFile)
      ? parseDeployOutput(readFileSync(outputFile, 'utf8'))
      : undefined;
    const url = deployed?.urls[0];
    log(`Deployed ${config.environment} to ${url ?? 'Cloudflare Workers'}`);
    const githubOutput = env['GITHUB_OUTPUT'];
    if (githubOutput && url) appendFileSync(githubOutput, `url=${url}\n`);
    return deployed;
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  try {
    runDeploy(process.argv.slice(2));
  } catch (error) {
    console.error(`deploy.ts: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
