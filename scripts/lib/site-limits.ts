/**
 * Limits of the hosting target for the built site (docs/project_plan.md section 4): Cloudflare
 * Workers Static Assets on the Free plan. Re-check them in the Cloudflare documentation when they
 * matter; they are constants here so the build fails loudly instead of a deploy failing later.
 */
export const WORKERS_FREE_LIMITS = {
  /** Files per Worker version. */
  maxFiles: 20_000,
  /** Size of one file, in bytes (25 MiB). */
  maxFileBytes: 25 * 1024 * 1024,
  /** `_redirects`: rules without placeholders or splats. */
  maxStaticRedirects: 2_000,
  /** `_redirects`: rules with placeholders or splats. */
  maxDynamicRedirects: 100,
  /** `_redirects`: characters per rule. */
  maxRedirectRuleLength: 1_000,
} as const;

/** Share of the file limit above which a warning is reported. */
export const FILE_COUNT_WARNING_RATIO = 0.75;

export interface SiteFile {
  /** Path relative to the site root, with `/` separators. */
  path: string;
  bytes: number;
}

export interface RedirectCounts {
  static: number;
  dynamic: number;
  /** Rules longer than the per-rule character limit. */
  tooLong: number;
}

/** Counts the rules of a `_redirects` file; blank lines and `#` comments are ignored. */
export function countRedirectRules(content: string): RedirectCounts {
  const counts: RedirectCounts = { static: 0, dynamic: 0, tooLong: 0 };
  for (const line of content.split('\n')) {
    const rule = line.trim();
    if (rule === '' || rule.startsWith('#')) continue;
    if (rule.length > WORKERS_FREE_LIMITS.maxRedirectRuleLength) counts.tooLong += 1;
    // A placeholder (`:name`) or splat (`*`) makes a rule dynamic.
    if (/(?:^|[\s/]):[A-Za-z]|\*/.test(rule)) counts.dynamic += 1;
    else counts.static += 1;
  }
  return counts;
}

export interface SiteReport {
  fileCount: number;
  totalBytes: number;
  largest: SiteFile | undefined;
  redirects: RedirectCounts;
  /** Limits that are exceeded; the build must fail. */
  errors: string[];
  /** Limits that are close; the build continues. */
  warnings: string[];
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

/** Checks the built site's files and `_redirects` content against the hosting limits. */
export function checkSiteLimits(
  files: readonly SiteFile[],
  redirectsContent: string,
  limits: typeof WORKERS_FREE_LIMITS = WORKERS_FREE_LIMITS,
): SiteReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const largest = files.reduce<SiteFile | undefined>(
    (max, file) => (max === undefined || file.bytes > max.bytes ? file : max),
    undefined,
  );
  const redirects = countRedirectRules(redirectsContent);

  if (files.length > limits.maxFiles) {
    errors.push(`${String(files.length)} files exceed the limit of ${String(limits.maxFiles)}.`);
  } else if (files.length > limits.maxFiles * FILE_COUNT_WARNING_RATIO) {
    warnings.push(
      `${String(files.length)} files use more than ${String(FILE_COUNT_WARNING_RATIO * 100)}% of the limit of ${String(limits.maxFiles)}.`,
    );
  }
  for (const file of files) {
    if (file.bytes > limits.maxFileBytes) {
      errors.push(
        `${file.path} is ${formatBytes(file.bytes)}, above the limit of ${formatBytes(limits.maxFileBytes)} per file.`,
      );
    }
  }
  if (redirects.static > limits.maxStaticRedirects) {
    errors.push(
      `${String(redirects.static)} static redirects exceed ${String(limits.maxStaticRedirects)}.`,
    );
  }
  if (redirects.dynamic > limits.maxDynamicRedirects) {
    errors.push(
      `${String(redirects.dynamic)} dynamic redirects exceed ${String(limits.maxDynamicRedirects)}.`,
    );
  }
  if (redirects.tooLong > 0) {
    errors.push(
      `${String(redirects.tooLong)} redirect rule(s) are longer than ${String(limits.maxRedirectRuleLength)} characters.`,
    );
  }

  return {
    fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    largest,
    redirects,
    errors,
    warnings,
  };
}
