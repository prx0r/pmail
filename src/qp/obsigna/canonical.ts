// src/qp/obsigna/canonical.ts — RFC 8785 JSON Canonicalization Scheme (JCS)

/**
 * Implementation of RFC 8785: JSON Canonicalization Scheme.
 * This is the standard for deterministic JSON serialization used in
 * cryptographic signing (obsigna, SCITT, W3C VC Data Integrity).
 *
 * Key rules:
 * - Object keys sorted lexicographically by UTF-16 code unit order
 * - Numbers use shortest ES6 representation
 * - No whitespace
 * - Strings use minimal escaping
 * - ensure_ascii=false (UTF-8 pass-through)
 */

export function jcsCanonicalize(obj: unknown): Uint8Array {
  const json = canonicalJson(obj);
  return new TextEncoder().encode(json);
}

export function canonicalJson(obj: unknown): string {
  if (obj === null) return "null";
  if (obj === undefined) return "undefined"; // should not appear in valid JSON
  if (typeof obj === "boolean") return obj ? "true" : "false";
  if (typeof obj === "number") return canonicalNumber(obj);
  if (typeof obj === "string") return canonicalString(obj);
  if (Array.isArray(obj)) return canonicalArray(obj);
  if (typeof obj === "object") return canonicalObject(obj);
  throw new Error(`Cannot canonicalize: ${typeof obj}`);
}

function canonicalNumber(n: number): string {
  if (Number.isNaN(n)) return "NaN";
  if (!Number.isFinite(n)) return n > 0 ? "Infinity" : "-Infinity";
  // ES6 shortest representation
  const s = String(n);
  // If it already doesn't have leading zeros or trailing dots, use it
  if (/^-?\d+$/.test(s) || /^-?\d+\.\d+$/.test(s)) return s;
  // Use toExponential for very large/small numbers
  return n.toExponential().replace(/e\+/, "e");
}

function canonicalString(s: string): string {
  // JSON string escaping per RFC 8785
  const escapeMap: Record<string, string> = {
    "\\": "\\\\",
    '"': '\\"',
    "\n": "\\n",
    "\r": "\\r",
    "\t": "\\t",
    "\b": "\\b",
    "\f": "\\f",
  };

  let result = '"';
  for (const ch of s) {
    if (ch in escapeMap) {
      result += escapeMap[ch];
    } else if (ch < " ") {
      // Control characters: \uXXXX
      result += "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0");
    } else {
      result += ch; // UTF-8 pass-through (ensure_ascii=false)
    }
  }
  result += '"';
  return result;
}

function canonicalArray(arr: unknown[]): string {
  const items = arr.map(canonicalJson);
  return "[" + items.join(",") + "]";
}

function canonicalObject(obj: object): string {
  // Sort keys lexicographically by UTF-16 code unit order (same as .sort())
  const keys = Object.keys(obj).sort();
  const pairs = keys.map((k) => canonicalString(k) + ":" + canonicalJson((obj as any)[k]));
  return "{" + pairs.join(",") + "}";
}
