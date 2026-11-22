// Server-only encryption for saved birth plans.
// AES-256-GCM: the database only ever holds ciphertext. The key lives in an
// environment variable (PLAN_ENCRYPTION_KEY), never in the database or the code.
import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto";

function master(): Buffer {
  const k = Buffer.from(process.env.PLAN_ENCRYPTION_KEY ?? "", "base64");
  if (k.length !== 32) throw new Error("PLAN_ENCRYPTION_KEY must be 32 random bytes, base64-encoded");
  return k;
}

// Two separate keys derived from the master key: one to encrypt, one to name rows.
const derive = (purpose: string) => Buffer.from(hkdfSync("sha256", master(), Buffer.alloc(0), `sabicare:${purpose}`, 32));

/** Row id = keyed hash of the user's id, so the database never stores emails or login ids. */
export function rowId(userId: string): string {
  return createHmac("sha256", derive("row-id")).update(userId).digest("hex");
}

/** Encrypt text. The row id is bound in as associated data, so a row copied to another user will not decrypt. */
export function encrypt(plain: string, row: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", derive("encrypt"), iv);
  c.setAAD(Buffer.from(row));
  const body = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), body.toString("base64")].join(".");
}

export function decrypt(payload: string, row: string): string {
  const [v, iv, tag, body] = payload.split(".");
  if (v !== "v1") throw new Error("Unknown payload version");
  const d = createDecipheriv("aes-256-gcm", derive("encrypt"), Buffer.from(iv, "base64"));
  d.setAAD(Buffer.from(row));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(body, "base64")), d.final()]).toString("utf8");
}
