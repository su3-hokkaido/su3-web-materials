import { describe, expect, it } from 'vitest';
import {
  WORKERS_FREE_LIMITS,
  checkSiteLimits,
  countRedirectRules,
  formatBytes,
  type SiteFile,
} from './site-limits.ts';

const files = (count: number, bytes = 100): SiteFile[] =>
  Array.from({ length: count }, (_, index) => ({ path: `f${String(index)}.js`, bytes }));

const redirects =
  '/:productId/c/:category/:component  /:productId/?path=/story/:category-:component--default  302\n';

describe('countRedirectRules', () => {
  it('ignores comments and blank lines and separates dynamic from static rules', () => {
    const content = `# comment\n\n${redirects}/old  /new  301\n/blog/*  /news/:splat  301\n`;
    expect(countRedirectRules(content)).toEqual({ static: 1, dynamic: 2, tooLong: 0 });
  });

  it('counts rules that are too long', () => {
    const long = `/a  /${'b'.repeat(WORKERS_FREE_LIMITS.maxRedirectRuleLength)}  302`;
    expect(countRedirectRules(long).tooLong).toBe(1);
  });
});

describe('checkSiteLimits', () => {
  it('reports counts, total size and the largest file without errors for a small site', () => {
    const report = checkSiteLimits([...files(3), { path: 'big.js', bytes: 5000 }], redirects);
    expect(report).toMatchObject({
      fileCount: 4,
      totalBytes: 5300,
      largest: { path: 'big.js', bytes: 5000 },
      errors: [],
      warnings: [],
    });
  });

  it('handles an empty site', () => {
    const report = checkSiteLimits([], '');
    expect(report.largest).toBeUndefined();
    expect(report.fileCount).toBe(0);
  });

  it('warns above 75% of the file limit and fails above the limit', () => {
    const near = checkSiteLimits(files(15_001), redirects);
    expect(near.errors).toEqual([]);
    expect(near.warnings[0]).toContain('75%');

    const over = checkSiteLimits(files(20_001), redirects);
    expect(over.errors[0]).toContain('exceed the limit of 20000');
  });

  it('fails for a file above the per-file limit', () => {
    const report = checkSiteLimits(
      [{ path: 'huge.bin', bytes: WORKERS_FREE_LIMITS.maxFileBytes + 1 }],
      redirects,
    );
    expect(report.errors[0]).toContain('huge.bin');
  });

  it('fails for too many redirect rules', () => {
    const dynamic = Array.from({ length: 101 }, (_, i) => `/a${String(i)}/:x  /b/:x  302`).join(
      '\n',
    );
    expect(checkSiteLimits([], dynamic).errors[0]).toContain('dynamic redirects');
    const fixed = Array.from({ length: 2001 }, (_, i) => `/a${String(i)}  /b  302`).join('\n');
    expect(checkSiteLimits([], fixed).errors[0]).toContain('static redirects');
    const long = `/a  /${'b'.repeat(1000)}  302`;
    expect(checkSiteLimits([], long).errors[0]).toContain('longer than');
  });
});

describe('formatBytes', () => {
  it('uses B, KiB and MiB', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KiB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MiB');
  });
});
