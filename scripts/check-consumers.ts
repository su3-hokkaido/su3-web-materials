/**
 * Proves the published package works for consumers (docs/project_plan.md sections 9 and 15). It
 * builds and packs the package, then for every fixture under tests/consumers: copies it to a
 * temporary directory outside the repository, installs the tarball with npm, builds and type-checks
 * it if the fixture has such scripts, serves the result and checks it in Chromium.
 *
 * Usage: node scripts/check-consumers.ts [fixture...]
 * Needs network access (npm install) and Chromium (Playwright). It is separate from `pnpm run ci`
 * for that reason; run it with `make check-consumers`.
 *
 * A fixture's consumer.json lists the pages to load. Each page must: define <su3-button>, give the
 * button the expected computed background ("default" is the light accent, "acme" the violet one),
 * and load without console errors or failed requests; `clickExpectsText` additionally clicks the
 * button and expects the text it then shows.
 */
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(import.meta.dirname, '..');
const fixturesDir = join(root, 'tests/consumers');

/** Computed `background-color` of the filled button: the default accent and the acme accent. */
const EXPECTED_BACKGROUND = {
  default: 'rgb(0, 96, 113)',
  acme: 'rgb(105, 57, 150)',
} as const;

interface PageSpec {
  path: string;
  expect: keyof typeof EXPECTED_BACKGROUND;
  clickExpectsText?: string;
}

interface ConsumerSpec {
  /** Directory served to the browser, relative to the fixture. */
  root: string;
  pages: PageSpec[];
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

function run(command: string, args: string[], cwd: string, label: string): void {
  console.log(`  $ ${label}`);
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    throw new Error(`${label} failed in ${cwd}\n${result.stdout}\n${result.stderr}`.trim());
  }
}

function serve(directory: string): Promise<{ server: Server; origin: string }> {
  return new Promise((resolvePromise) => {
    const server = createServer((request, response) => {
      const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
      const file = join(directory, pathname === '/' ? 'index.html' : pathname);
      if (!file.startsWith(directory) || !existsSync(file)) {
        response.statusCode = 404;
        response.end('not found');
        return;
      }
      response.setHeader('content-type', MIME[extname(file)] ?? 'application/octet-stream');
      response.end(readFileSync(file));
    });
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolvePromise({ server, origin: `http://127.0.0.1:${String(port)}` });
    });
  });
}

async function checkPage(origin: string, spec: PageSpec): Promise<string[]> {
  const failures: string[] = [];
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    page.on('console', (message) => {
      if (message.type() === 'error') failures.push(`console error: ${message.text()}`);
    });
    page.on('pageerror', (error) => failures.push(`page error: ${error.message}`));
    page.on('requestfailed', (request) => failures.push(`request failed: ${request.url()}`));
    page.on('response', (response) => {
      if (response.status() >= 400)
        failures.push(`HTTP ${String(response.status())}: ${response.url()}`);
    });

    await page.goto(`${origin}${spec.path}`);
    await page.waitForSelector('su3-button', { timeout: 15_000 });
    await page.waitForTimeout(300);

    const result = await page.evaluate(() => {
      const host = document.querySelector('su3-button');
      const control = host?.shadowRoot?.querySelector('[part="button"]');
      return {
        defined: customElements.get('su3-button') !== undefined,
        rendered: control !== null && control !== undefined,
        background: control ? getComputedStyle(control).backgroundColor : '',
      };
    });
    if (!result.defined) failures.push('su3-button is not defined');
    if (!result.rendered) failures.push('su3-button did not render its button part');
    const expected = EXPECTED_BACKGROUND[spec.expect];
    if (result.background !== expected) {
      failures.push(`background is ${result.background}, expected ${expected} (${spec.expect})`);
    }

    if (spec.clickExpectsText !== undefined) {
      await page.getByRole('button').first().click();
      const text = (await page.locator('su3-button').first().innerText()).trim();
      if (text !== spec.clickExpectsText)
        failures.push(`after a click the text is "${text}", expected "${spec.clickExpectsText}"`);
    }
  } finally {
    await browser.close();
  }
  return failures;
}

async function checkFixture(name: string, tarball: string, workRoot: string): Promise<string[]> {
  const source = join(fixturesDir, name);
  const work = join(workRoot, name);
  cpSync(source, work, { recursive: true });

  const packageJsonPath = join(work, 'package.json');
  writeFileSync(
    packageJsonPath,
    readFileSync(packageJsonPath, 'utf8').replace('file:PLACEHOLDER', `file:${tarball}`),
  );

  // Install scripts are not needed (Vite and Rolldown use prebuilt optional binaries) and are not run.
  run(
    'npm',
    ['install', '--no-audit', '--no-fund', '--ignore-scripts'],
    work,
    `npm install (${name})`,
  );
  const { scripts = {} } = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    scripts?: Record<string, string>;
  };
  if (scripts['typecheck']) run('npm', ['run', 'typecheck'], work, `npm run typecheck (${name})`);
  if (scripts['build']) run('npm', ['run', 'build'], work, `npm run build (${name})`);

  const spec = JSON.parse(readFileSync(join(work, 'consumer.json'), 'utf8')) as ConsumerSpec;
  const { server, origin } = await serve(join(work, spec.root));
  const failures: string[] = [];
  try {
    for (const page of spec.pages) {
      const pageFailures = await checkPage(origin, page);
      console.log(
        `  ${pageFailures.length === 0 ? 'ok  ' : 'FAIL'} ${name}${page.path} (${page.expect})`,
      );
      failures.push(...pageFailures.map((failure) => `${name}${page.path}: ${failure}`));
    }
  } finally {
    server.close();
  }
  return failures;
}

async function main(): Promise<void> {
  const available = readdirSync(fixturesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const requested = process.argv.slice(2);
  const unknown = requested.filter((name) => !available.includes(name));
  if (unknown.length > 0)
    throw new Error(`Unknown fixture: ${unknown.join(', ')}. Available: ${available.join(', ')}`);
  const fixtures = requested.length > 0 ? requested : available;

  console.log('Building and packing the package');
  run('pnpm', ['run', 'build'], root, 'pnpm run build');
  const workRoot = mkdtempSync(join(tmpdir(), 'su3-consumers-'));
  const packDir = join(workRoot, 'pack');
  mkdirSync(packDir);
  run('pnpm', ['pack', '--pack-destination', packDir], root, 'pnpm pack');
  const tarball = join(packDir, readdirSync(packDir).find((file) => file.endsWith('.tgz')) ?? '');

  const failures: string[] = [];
  try {
    for (const name of fixtures) {
      console.log(`\nFixture ${name}`);
      try {
        failures.push(...(await checkFixture(name, tarball, workRoot)));
      } catch (error) {
        failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  } finally {
    rmSync(workRoot, { recursive: true, force: true });
  }

  if (failures.length > 0) {
    console.error(`\nConsumer check failed:\n- ${failures.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`\nConsumer check passed for ${fixtures.join(', ')}.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
