import type * as MonacoType from "monaco-editor";

/**
 * Faker variable definitions.
 * Each entry has: a resolver fn, the resolved type, and a human description.
 * Syntax: {{$variableName}} inside any JSON string value.
 *
 * Type-aware resolution — number/boolean vars resolve to unquoted JSON literals.
 * e.g.  "age": "{{$randomInt}}"  →  "age": 42
 *       "name": "{{$firstName}}"  →  "name": "Alice"
 */
export interface FakerVarDef {
  resolve: () => unknown;
  type: "string" | "number" | "boolean" | "uuid";
  description: string;
  example: string;
}

// ── Static word banks (no external dep) ──────────────

const _FIRST = [
  "Alice",
  "Bob",
  "Carol",
  "Dave",
  "Eva",
  "Frank",
  "Grace",
  "Henry",
  "Iris",
  "Jack",
  "Kate",
  "Liam",
  "Mia",
  "Noah",
  "Olivia",
  "Paul",
  "Quinn",
  "Rosa",
  "Sam",
  "Tina",
];

const _LAST = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Wilson",
  "Moore",
  "Taylor",
  "Anderson",
  "Thomas",
  "Jackson",
  "White",
  "Harris",
  "Martin",
  "Thompson",
];

const _WORDS = [
  "alpha",
  "beta",
  "gamma",
  "delta",
  "echo",
  "foxtrot",
  "hotel",
  "india",
  "juliet",
  "kilo",
  "lima",
  "mike",
  "november",
  "oscar",
  "papa",
  "quebec",
  "romeo",
  "sierra",
  "tango",
  "uniform",
];

const _DOMAINS = [
  "example.com",
  "mail.io",
  "test.dev",
  "inbox.net",
  "demo.org",
];

const _TLDS = ["com", "io", "dev", "net", "org", "co"];

const _LOCALES = [
  "en-US",
  "en-GB",
  "fr-FR",
  "de-DE",
  "ja-JP",
  "pt-BR",
  "es-ES",
  "zh-CN",
];

const _COLORS = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "orange",
  "teal",
  "pink",
  "indigo",
  "cyan",
];

const _STATUS = ["active", "inactive", "pending", "suspended", "verified"];

const _ROLES = ["admin", "user", "moderator", "editor", "viewer", "superadmin"];

function _pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function _int(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function _uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const FAKER_VARS: Record<string, FakerVarDef> = {
  $randomFirstName: {
    resolve: () => _pick(_FIRST),
    type: "string",
    description: "Random first name",
    example: "Alice",
  },
  $randomLastName: {
    resolve: () => _pick(_LAST),
    type: "string",
    description: "Random last name",
    example: "Smith",
  },
  $randomFullName: {
    resolve: () => `${_pick(_FIRST)} ${_pick(_LAST)}`,
    type: "string",
    description: "Full name",
    example: "Alice Smith",
  },
  $randomEmail: {
    resolve: () =>
      `${_pick(_FIRST).toLowerCase()}.${_pick(_LAST).toLowerCase()}${_int(1, 99)}@${_pick(_DOMAINS)}`,
    type: "string",
    description: "Random email address",
    example: "alice.smith42@example.com",
  },
  $randomUsername: {
    resolve: () => `${_pick(_FIRST).toLowerCase()}${_int(10, 999)}`,
    type: "string",
    description: "Random username",
    example: "alice247",
  },
  $randomPassword: {
    resolve: () =>
      Array.from(
        { length: 12 },
        () =>
          "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"[
            _int(0, 66)
          ],
      ).join(""),
    type: "string",
    description: "Random 12-char password",
    example: "aB3!xYqZ9kP2",
  },
  $randomUUID: {
    resolve: _uuid,
    type: "uuid",
    description: "Random UUID v4",
    example: "110e8400-e29b-41d4-a716-446655440000",
  },
  $randomInt: {
    resolve: () => _int(1, 9999),
    type: "number",
    description: "Random integer 1–9999",
    example: "4271",
  },
  $randomFloat: {
    resolve: () => parseFloat((Math.random() * 1000).toFixed(2)),
    type: "number",
    description: "Random float",
    example: "347.85",
  },
  $randomBoolean: {
    resolve: () => Math.random() > 0.5,
    type: "boolean",
    description: "Random true/false",
    example: "true",
  },
  $timestamp: {
    resolve: () => Date.now(),
    type: "number",
    description: "Current Unix ms timestamp",
    example: "1711012345678",
  },
  $isoTimestamp: {
    resolve: () => new Date().toISOString(),
    type: "string",
    description: "Current ISO 8601 date-time",
    example: "2026-03-20T14:30:00.000Z",
  },
  $randomWord: {
    resolve: () => _pick(_WORDS),
    type: "string",
    description: "Random NATO phonetic word",
    example: "alpha",
  },
  $randomSlug: {
    resolve: () => `${_pick(_WORDS)}-${_pick(_WORDS)}-${_int(10, 99)}`,
    type: "string",
    description: "URL-friendly slug",
    example: "alpha-bravo-42",
  },
  $randomDomain: {
    resolve: () => `${_pick(_WORDS)}.${_pick(_TLDS)}`,
    type: "string",
    description: "Random domain",
    example: "echo.dev",
  },
  $randomUrl: {
    resolve: () => `https://${_pick(_WORDS)}.${_pick(_TLDS)}/${_pick(_WORDS)}`,
    type: "string",
    description: "Random URL",
    example: "https://alpha.io/beta",
  },
  $randomColor: {
    resolve: () => _pick(_COLORS),
    type: "string",
    description: "Random color name",
    example: "teal",
  },
  $randomHexColor: {
    resolve: () => `#${_int(0, 0xffffff).toString(16).padStart(6, "0")}`,
    type: "string",
    description: "Random hex color",
    example: "#a3f2c1",
  },
  $randomStatus: {
    resolve: () => _pick(_STATUS),
    type: "string",
    description: "Random status value",
    example: "active",
  },
  $randomRole: {
    resolve: () => _pick(_ROLES),
    type: "string",
    description: "Random role",
    example: "editor",
  },
  $randomLocale: {
    resolve: () => _pick(_LOCALES),
    type: "string",
    description: "Random locale code",
    example: "en-US",
  },
  $randomIP: {
    resolve: () =>
      `${_int(1, 254)}.${_int(0, 254)}.${_int(0, 254)}.${_int(1, 254)}`,
    type: "string",
    description: "Random IPv4 address",
    example: "192.168.4.21",
  },
  $randomPort: {
    resolve: () => _int(1024, 65535),
    type: "number",
    description: "Random port number",
    example: "8432",
  },
  $randomVersion: {
    resolve: () => `${_int(0, 5)}.${_int(0, 20)}.${_int(0, 100)}`,
    type: "string",
    description: "Random semver string",
    example: "2.7.14",
  },
};

/**
 * Resolves all `{{$varName}}` placeholders in a raw JSON string.
 *
 * TYPE-AWARE: When the entire JSON value is a faker placeholder
 * (i.e. `"{{$randomInt}}"`) the surrounding quotes are removed
 * so numbers and booleans land as their correct JSON types.
 *
 * Mixed strings like `"user-{{$randomInt}}"` always resolve as strings.
 *
 * @example
 * ```
 * // Pure placeholder (entire value):
 * resolveFakerVars('{"age": "{{$randomInt}}"}')
 * // Returns: {"age": 42}  <- unquoted number
 *
 * // Interpolated (part of string):
 * resolveFakerVars('{"user": "user-{{$randomInt}}"}')
 * // Returns: {"user": "user-847"}  <- quoted string
 * ```
 *
 * @param jsonStr - JSON string (possibly with faker placeholders like {{$randomInt}} or {{$randomFirstName}})
 * @returns JSON string with all {{$varName}} placeholders resolved
 */
export function resolveFakerVars(jsonStr: string): string {
  // Pass 1 — pure-value replacements (the whole string value IS one var)
  // "{{$randomInt}}" → 42  (unquoted — correct JSON type)
  let result = jsonStr.replace(
    /"(\{\{(\$[^}]+)\}\})"/g,
    (match, _full, varName) => {
      const def = FAKER_VARS[varName];
      if (!def) return match;
      const value = def.resolve();
      if (typeof value === "string") return JSON.stringify(value);
      // number / boolean → unquoted literal
      return JSON.stringify(value);
    },
  );

  // Pass 2 — interpolated replacements inside a larger string
  // "Hello {{$randomFirstName}}, your ID is {{$randomInt}}"
  // → always a string, vars become their string representation
  result = result.replace(/\{\{(\$[^}]+)\}\}/g, (match, varName) => {
    const def = FAKER_VARS[varName];
    if (!def) return match;
    return String(def.resolve());
  });

  return result;
}

/**
 * Check if a JSON string contains any faker placeholders. * * Used before calling resolveFakerVars() to avoid unnecessary regex scanning. * Checks for the pattern `{{$varName}}`. * * @example
 * ```
 * hasFakerVars('{"name": "Alice"}') // false
 * hasFakerVars('{"name": "{{$randomFirstName}}"}') // true
 * ```
 *
 * @param jsonStr - String to check for faker placeholders
 * @returns true if string contains any {{$varName}} patterns
 */
export function hasFakerVars(jsonStr: string): boolean {
  return /\{\{\$[^}]+\}\}/.test(jsonStr);
}

// ── Faker completion items for Monaco ─────────────────

/**
 * Build Monaco Editor completion items for faker variables.
 *
 * Creates a list of CompletionItems based on FAKER_VARS, ready to be passed
 * to Monaco's completion provider. Each item includes:
 * - Display label: `{{$variableName}}`
 * - Type/kind indicator: "faker · string|number|boolean|uuid"
 * - Description and example from the variable definition
 * - Correct insertion text and filter/sort keys
 *
 * Registered automatically in EventPanel's useEffect when Monaco language
 * provider initializes. Triggered on `{` keypress or Ctrl+Space in JSON editor.
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   if (!monaco) return;
 *   monaco.languages.registerCompletionItemProvider("json", {
 *     triggerCharacters: ["{", "$"],
 *     provideCompletionItems(model, position) {
 *       const range = model.getWordUntilPosition(position);
 *       const completeRange = {
 *         startLineNumber: position.lineNumber,
 *         startColumn: range.startColumn,
 *         endLineNumber: position.lineNumber,
 *         endColumn: position.column,
 *       };
 *       return {
 *         suggestions: buildFakerCompletions(monaco, completeRange),
 *       };
 *     },
 *   });
 * }, [monaco]);
 * ```
 *
 * @param monaco - Monaco editor module (from useMonaco() hook)
 * @param range - The range object for where completions should be inserted
 * @returns Array of CompletionItem objects for all faker variables
 */

export function buildFakerCompletions(
  monaco: typeof MonacoType,
  range: MonacoType.IRange,
): MonacoType.languages.CompletionItem[] {
  return Object.entries(FAKER_VARS).map(([name, def]) => ({
    label: `{{${name}}}`,
    kind: monaco.languages.CompletionItemKind.Variable,
    detail: `faker · ${def.type}`,
    documentation: {
      value: `**${def.description}**

Example: \`${def.example}\`

Type: \`${def.type}\``,
    },
    insertText: `{{${name}}}`,
    filterText: name,
    sortText: name,
    range,
  }));
}
