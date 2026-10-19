import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { authConfigured, isAllowedOperatorEmail, isAllowedReviewerEmail,
  previewEnvironmentAllowed } from "./access";

export const opsAuthOptions: NextAuthOptions = {
  providers: authConfigured() ? [GoogleProvider({
    clientId: process.env.AUTH_GOOGLE_ID ?? "",
    clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    authorization: { params: { prompt: "select_account" } }
  })] : [],
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 4 * 60 * 60 },
  pages: { signIn: "/ops/login", error: "/ops/login" },
  callbacks: {
    async signIn({ account, profile, user }) {
      return previewEnvironmentAllowed() && account?.provider === "google" &&
        profile?.email_verified === true &&
        isAllowedOperatorEmail(profile?.email ?? user.email);
    },
    async session({ session }) {
      if (session.user && !isAllowedOperatorEmail(session.user.email)) {
        session.user = { ...session.user, email: null };
      }
      return session;
    }
  }
};

/** Re-check the live allowlist on every server request, not just at login. */
export async function getOperatorEmail(): Promise<string | null> {
  if (!previewEnvironmentAllowed() || !authConfigured()) return null;
  try {
    const session = await getServerSession(opsAuthOptions);
    const email = session?.user?.email;
    return isAllowedOperatorEmail(email) ? (email as string).trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

export function canOperatorReview(email: string | null): boolean {
  return Boolean(email && isAllowedReviewerEmail(email));
}
