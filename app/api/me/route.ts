// GET /api/me -> { loginEnabled, user, cloud }   Who is signed in, if login is switched on.
// cloud = signed-in plans are saved (encrypted) in the database.
import { connection } from "next/server";
import { auth, loginEnabled } from "@/auth";
import { dbEnabled } from "@/lib/db";

export async function GET() {
  await connection(); // answer per request, never from a build-time copy
  const session = loginEnabled ? await auth() : null;
  const user = session?.user ? (session.user.email ?? session.user.name ?? "you") : null;
  return Response.json({ loginEnabled, user, cloud: loginEnabled && dbEnabled });
}
