import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function importCodeAgentCoreModule<T>(relativePath: string): Promise<T> {
  const candidates = [
    process.env.CODEAGENT_CORE_RUNTIME_ROOT,
    process.env.CODEAGENT_CORE_ROOT,
    path.resolve(process.cwd(), 'dist'),
    process.cwd(),
  ].filter(Boolean) as string[];

  const errors: string[] = [];
  for (const root of candidates) {
    const modulePath = path.resolve(root, relativePath);
    try {
      return await import(pathToFileURL(modulePath).href) as T;
    } catch (error) {
      errors.push(`${modulePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`Unable to load CodeAgent core module ${relativePath}. Checked ${errors.join('; ')}`);
}

export function parseShellLikeTokens(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote: '"' | "'" | '' = '';
  let escaping = false;

  for (const char of input) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }
    if (char === '\\' && quote !== "'") {
      escaping = true;
      continue;
    }
    if ((char === '"' || char === "'") && (!quote || quote === char)) {
      quote = quote ? '' : char;
      continue;
    }
    if (!quote && /\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }
    current += char;
  }

  if (escaping) {
    current += '\\';
  }
  if (quote) {
    throw new Error(`Unclosed ${quote} quote.`);
  }
  if (current) {
    tokens.push(current);
  }
  return tokens;
}
