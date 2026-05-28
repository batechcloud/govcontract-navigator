import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import type { Plugin } from "vite";

/**
 * Vite plugin: scans the built client bundle for secret-like strings
 * and fails the build if any are found.
 *
 * Allowlist:
 *  - Supabase anon JWTs (role === "anon") — these are publishable by design.
 */

interface SecretPattern {
  name: string;
  regex: RegExp;
  /** Optional filter — return true to ignore the match (treat as not-a-secret). */
  ignore?: (match: string) => boolean;
}

const SCANNED_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".css", ".html", ".map", ".json"]);

function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  try {
    const [, payload] = jwt.split(".");
    if (!payload) return null;
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

const PATTERNS: SecretPattern[] = [
  {
    name: "JWT (non-anon)",
    regex: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    ignore: (match) => {
      const payload = decodeJwtPayload(match);
      // Allow only Supabase anon publishable keys
      return payload?.role === "anon";
    },
  },
  { name: "AWS Access Key ID", regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: "AWS Secret Access Key", regex: /\baws_secret_access_key\s*[:=]\s*["'][^"']{20,}["']/gi },
  { name: "Google API Key", regex: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { name: "OpenAI API Key", regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g },
  { name: "Anthropic API Key", regex: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g },
  { name: "Stripe Secret Key", regex: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{20,}\b/g },
  { name: "GitHub Token", regex: /\b(?:ghp|gho|ghs|ghu|ghr)_[A-Za-z0-9]{30,}\b/g },
  { name: "Supabase Service Role JWT", regex: /service_role/g, ignore: (m) => m.length === 0 },
  { name: "Slack Token", regex: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g },
  { name: "Private Key Block", regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/g },
];

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) yield* walk(full);
    else yield full;
  }
}

interface Finding {
  file: string;
  pattern: string;
  sample: string;
}

function scanBundle(distDir: string): Finding[] {
  const findings: Finding[] = [];
  for (const file of walk(distDir)) {
    if (!SCANNED_EXTENSIONS.has(extname(file))) continue;
    let content: string;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const { name, regex, ignore } of PATTERNS) {
      regex.lastIndex = 0;
      const matches = content.match(regex);
      if (!matches) continue;
      for (const m of matches) {
        if (ignore?.(m)) continue;
        findings.push({
          file: file.replace(distDir, ""),
          pattern: name,
          sample: m.length > 40 ? `${m.slice(0, 20)}…${m.slice(-8)}` : m,
        });
      }
    }
  }
  return findings;
}

export function secretScannerPlugin(): Plugin {
  let outDir = "dist";
  return {
    name: "lovable-secret-scanner",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir || "dist";
    },
    closeBundle() {
      const dir = join(process.cwd(), outDir);
      let findings: Finding[];
      try {
        findings = scanBundle(dir);
      } catch (err) {
        this.warn(`secret-scanner: could not scan ${dir}: ${(err as Error).message}`);
        return;
      }
      if (findings.length === 0) {
        console.log("\x1b[32m✓ secret-scanner: no secrets detected in client bundle\x1b[0m");
        return;
      }
      }
      const summary = findings
        .map((f) => `  • [${f.pattern}] ${f.file} → ${f.sample}`)
        .join("\n");
      this.error(
        `\nSECRET LEAK DETECTED IN CLIENT BUNDLE — build aborted.\n${summary}\n\n` +
          `Move these values to Supabase Edge Function secrets and call them via supabase.functions.invoke().\n`,
      );
    },
  };
}
