import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runDeploy } from './deploy.ts';
import {
  isDeployEnvironment,
  parseDeployOutput,
  readDeployConfig,
  workerNameFor,
} from './deploy-lib.ts';

describe('workerNameFor', () => {
  it('uses the configured name for production and adds -dev for development', () => {
    expect(workerNameFor('production', 'su3-web-materials')).toBe('su3-web-materials');
    expect(workerNameFor('development', 'su3-web-materials')).toBe('su3-web-materials-dev');
  });

  it('rejects names Cloudflare would refuse, counting the suffix', () => {
    for (const bad of ['Upper', 'under_score', '-leading', 'trailing-', '', 'with space']) {
      expect(() => workerNameFor('production', bad), bad).toThrow('not a valid Worker name');
    }
    const long = 'a'.repeat(60);
    expect(workerNameFor('production', long)).toBe(long);
    expect(() => workerNameFor('development', long)).toThrow('at most 63');
  });
});

describe('isDeployEnvironment', () => {
  it('accepts the two environments only', () => {
    expect(isDeployEnvironment('development')).toBe(true);
    expect(isDeployEnvironment('production')).toBe(true);
    expect(isDeployEnvironment('staging')).toBe(false);
  });
});

describe('readDeployConfig', () => {
  const env = {
    CLOUDFLARE_API_TOKEN: 'token',
    CLOUDFLARE_ACCOUNT_ID: 'account',
    CLOUDFLARE_WORKER_NAME: 'site',
  };

  it('returns the configuration for a valid call', () => {
    expect(readDeployConfig(['development'], env)).toEqual({
      environment: 'development',
      workerName: 'site-dev',
      apiToken: 'token',
      accountId: 'account',
    });
  });

  it('reports a bad or missing environment argument', () => {
    expect(() => readDeployConfig([], env)).toThrow('Usage');
    expect(() => readDeployConfig(['staging'], env)).toThrow('Usage');
    expect(() => readDeployConfig(['production', 'extra'], env)).toThrow('Usage');
  });

  it('lists every missing variable at once', () => {
    expect(() => readDeployConfig(['production'], { CLOUDFLARE_WORKER_NAME: 'site' })).toThrow(
      'CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID',
    );
    expect(() => readDeployConfig(['production'], {})).toThrow(/CLOUDFLARE_WORKER_NAME/);
  });
});

describe('parseDeployOutput', () => {
  const session = '{"type":"wrangler-session","version":1}';
  const first =
    '{"type":"deploy","worker_name":"site","version_id":"v1","targets":["https://a.workers.dev"]}';
  const second =
    '{"type":"deploy","worker_name":"site","version_id":"v2","targets":["https://b.workers.dev","x"]}';

  it('returns the last deploy entry', () => {
    expect(parseDeployOutput(`${session}\n${first}\n${second}\n`)).toEqual({
      workerName: 'site',
      versionId: 'v2',
      urls: ['https://b.workers.dev', 'x'],
    });
  });

  it('ignores malformed lines, other entry types and non-string targets', () => {
    const odd = '{"type":"deploy","targets":[1,"https://c.workers.dev",null]}';
    expect(parseDeployOutput(`not json\n\n42\n${session}\n${odd}\n`)).toEqual({
      workerName: '',
      versionId: undefined,
      urls: ['https://c.workers.dev'],
    });
    expect(parseDeployOutput(`${session}\n`)).toBeUndefined();
    expect(parseDeployOutput('')).toBeUndefined();
  });
});

describe('runDeploy with a stubbed pnpm', () => {
  let root: string;
  let bin: string;
  let calls: string;
  const messages: string[] = [];

  const stub = (script: string): void => {
    writeFileSync(join(bin, 'pnpm'), `#!/bin/bash\n${script}\n`);
    chmodSync(join(bin, 'pnpm'), 0o755);
  };

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'deploy-'));
    bin = join(root, 'bin');
    calls = join(root, 'calls.txt');
    mkdirSync(bin);
    mkdirSync(join(root, 'dist/storybook'), { recursive: true });
    writeFileSync(join(root, 'dist/storybook/index.html'), '');
    writeFileSync(join(root, 'dist/storybook/_redirects'), '');
    messages.length = 0;
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  const options = (extra: Record<string, string> = {}) => ({
    root,
    log: (message: string) => messages.push(message),
    env: {
      PATH: `${bin}${delimiter}${process.env['PATH'] ?? ''}`,
      CLOUDFLARE_API_TOKEN: 'token',
      CLOUDFLARE_ACCOUNT_ID: 'account',
      CLOUDFLARE_WORKER_NAME: 'site',
      ...extra,
    },
  });

  it('runs wrangler deploy for the right Worker and reports the URL', () => {
    stub(
      `echo "$@" >> "${calls}"
echo "token=$CLOUDFLARE_API_TOKEN account=$CLOUDFLARE_ACCOUNT_ID" >> "${calls}"
echo '{"type":"deploy","worker_name":"site-dev","version_id":"v9","targets":["https://site-dev.example.workers.dev"]}' > "$WRANGLER_OUTPUT_FILE_PATH"`,
    );
    const githubOutput = join(root, 'github-output.txt');
    const result = runDeploy(['development'], options({ GITHUB_OUTPUT: githubOutput }));

    expect(result?.urls).toEqual(['https://site-dev.example.workers.dev']);
    expect(readFileSync(calls, 'utf8')).toContain(
      'exec wrangler deploy --config deploy/cloudflare/wrangler.jsonc --name site-dev',
    );
    expect(readFileSync(calls, 'utf8')).toContain('token=token account=account');
    expect(readFileSync(githubOutput, 'utf8')).toBe('url=https://site-dev.example.workers.dev\n');
    expect(messages.at(-1)).toBe('Deployed development to https://site-dev.example.workers.dev');
  });

  it('deploys production to the configured name and survives missing output', () => {
    stub(`echo "$@" >> "${calls}"`);
    expect(runDeploy(['production'], options())).toBeUndefined();
    expect(readFileSync(calls, 'utf8')).toContain('--name site\n');
    expect(messages.at(-1)).toBe('Deployed production to Cloudflare Workers');
  });

  it('fails when wrangler fails', () => {
    stub('exit 3');
    expect(() => runDeploy(['production'], options())).toThrow('exit code 3');
  });

  it('fails before running anything when the site is incomplete or the configuration is bad', () => {
    stub(`echo ran >> "${calls}"`);
    rmSync(join(root, 'dist/storybook/_redirects'));
    expect(() => runDeploy(['production'], options())).toThrow('dist/storybook is incomplete');
    expect(() =>
      runDeploy(['production'], { ...options(), env: { PATH: process.env['PATH'] } }),
    ).toThrow('Missing environment variable');
    expect(() => runDeploy(['nowhere'], options())).toThrow('Usage');
    expect(() => readFileSync(calls, 'utf8')).toThrow();
  });
});
