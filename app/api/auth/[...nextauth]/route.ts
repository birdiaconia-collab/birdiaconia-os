import NextAuth from "next-auth";
import { opsAuthOptions } from "../../../../lib/ops/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const handler = NextAuth(opsAuthOptions);
export { handler as GET, handler as POST };
