// GET / PUT / DELETE /api/plan   The signed-in user's profile and birth plan.
// Encrypted on this server before it is stored in Supabase. Guests never call this:
// their plan stays on their phone.
import { connection } from "next/server";
import { auth, loginEnabled } from "@/auth";
import { db, dbEnabled } from "@/lib/db";
import { decrypt, encrypt, rowId } from "@/lib/crypto";

const TEXT_FIELDS = ["name", "age", "dueDate", "facility", "driver", "driverPhone", "donors", "familyPhone"] as const;

async function signedInRow() {
  if (!loginEnabled || !dbEnabled) return null;
  const session = await auth();
  const id = session?.user?.id ?? session?.user?.email;
  return id ? rowId(id) : null;
}

const unauthorised = () => Response.json({ error: "Sign in to save your details." }, { status: 401 });
const failed = (what: string, e: unknown) => {
  console.error(`Plan ${what} failed:`, e instanceof Error ? e.message : e);
  return Response.json({ error: "Could not reach the database. Your details are not saved." }, { status: 500 });
};

export async function GET() {
  await connection(); // answer per request, never from a build-time copy
  const row = await signedInRow();
  if (!row) return unauthorised();
  try {
    const { data, error } = await db().from("plans").select("payload").eq("id", row).maybeSingle();
    if (error) throw error;
    return Response.json({ plan: data ? JSON.parse(decrypt(data.payload, row)) : null });
  } catch (e) {
    return failed("load", e);
  }
}

export async function PUT(request: Request) {
  const row = await signedInRow();
  if (!row) return unauthorised();
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send the plan as JSON." }, { status: 400 });
  }
  // Keep only the known fields, as short strings: nothing else is stored.
  const plan: Record<string, string | boolean> = { money: body.money === true };
  for (const k of TEXT_FIELDS) plan[k] = String(body[k] ?? "").slice(0, 200);
  try {
    const { error } = await db()
      .from("plans")
      .upsert({ id: row, payload: encrypt(JSON.stringify(plan), row), updated_at: new Date().toISOString() });
    if (error) throw error;
    return Response.json({ saved: true });
  } catch (e) {
    return failed("save", e);
  }
}

export async function DELETE() {
  const row = await signedInRow();
  if (!row) return unauthorised();
  try {
    const { error } = await db().from("plans").delete().eq("id", row);
    if (error) throw error;
    return Response.json({ deleted: true });
  } catch (e) {
    return failed("delete", e);
  }
}
