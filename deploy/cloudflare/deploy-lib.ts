/**
 * Pure helpers of the Cloudflare deploy (docs/project_plan.md sections 4 and 8): which Worker an
 * environment deploys to, what the deploy needs from the environment, and how to read the URL from
 * Wrangler's output file. No file system or process access, so Vitest covers them; deploy.ts runs
 * them.
 */

export const DEPLOY_ENVIRONMENTS = ['development', 'production'] as const;
export type DeployEnvironment = (typeof DEPLOY_ENVIRONMENTS)[number];

/** Suffix of the persistent preview Worker that `develop` deploys to. */
export const DEVELOPMENT_SUFFIX = '-dev';

/** Cloudflare Worker names: lower-case letters, digits and dashes, at most 63 characters. */
const WORKER_NAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const MAX_WORKER_NAME_LENGTH = 63;

export function isDeployEnvironment(value: string): value is DeployEnvironment {
  return (DEPLOY_ENVIRONMENTS as readonly string[]).includes(value);
}

/**
 * The Worker an environment deploys to: production uses the configured name, development a second,
 * persistent Worker with the `-dev` suffix (the preview environment, docs/project_plan.md section 4).
 */
export function workerNameFor(environment: DeployEnvironment, baseName: string): string {
  const name = environment === 'production' ? baseName : `${baseName}${DEVELOPMENT_SUFFIX}`;
  if (!WORKER_NAME_PATTERN.test(name) || name.length > MAX_WORKER_NAME_LENGTH) {
    throw new Error(
      `"${name}" is not a valid Worker name: use lower-case letters, digits and dashes, at most ` +
        `${String(MAX_WORKER_NAME_LENGTH)} characters (the -dev suffix counts).`,
    );
  }
  return name;
}

export interface DeployConfig {
  environment: DeployEnvironment;
  workerName: string;
  apiToken: string;
  accountId: string;
}

/** Validates the command line and the environment; every missing variable is reported at once. */
export function readDeployConfig(
  args: readonly string[],
  env: Readonly<Record<string, string | undefined>>,
): DeployConfig {
  const [environment, ...extra] = args;
  if (environment === undefined || extra.length > 0 || !isDeployEnvironment(environment)) {
    throw new Error(`Usage: deploy.ts <${DEPLOY_ENVIRONMENTS.join('|')}>`);
  }
  const required = ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_WORKER_NAME'];
  const missing = required.filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variable(s): ${missing.join(', ')}.`);
  }
  return {
    environment,
    workerName: workerNameFor(environment, env['CLOUDFLARE_WORKER_NAME'] ?? ''),
    apiToken: env['CLOUDFLARE_API_TOKEN'] ?? '',
    accountId: env['CLOUDFLARE_ACCOUNT_ID'] ?? '',
  };
}

export interface DeployResult {
  workerName: string;
  versionId: string | undefined;
  /** URLs the Worker is reachable at, as reported by Wrangler. */
  urls: string[];
}

/**
 * Reads the `deploy` entry from Wrangler's output file (`WRANGLER_OUTPUT_FILE_PATH`, one JSON
 * object per line) and returns the last one, or undefined when there is none. Malformed lines are
 * ignored: the URL is informational and must not fail a deployment that succeeded.
 */
export function parseDeployOutput(ndjson: string): DeployResult | undefined {
  let result: DeployResult | undefined;
  for (const line of ndjson.split('\n')) {
    if (line.trim() === '') continue;
    let entry: unknown;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (typeof entry !== 'object' || entry === null) continue;
    const record = entry as Record<string, unknown>;
    if (record['type'] !== 'deploy') continue;
    const targets = Array.isArray(record['targets'])
      ? record['targets'].filter((target): target is string => typeof target === 'string')
      : [];
    result = {
      workerName: typeof record['worker_name'] === 'string' ? record['worker_name'] : '',
      versionId: typeof record['version_id'] === 'string' ? record['version_id'] : undefined,
      urls: targets,
    };
  }
  return result;
}
