// Passwordless login with MojoAuth (OpenID Connect), through Auth.js.
// Login is OPTIONAL and never blocks the symptom check. It only gives each
// woman her own private birth plan when several people share one phone.
// It switches on only when the MojoAuth settings are present in .env.local.
import NextAuth from "next-auth";

export const loginEnabled = Boolean(
  process.env.AUTH_MOJOAUTH_ISSUER && process.env.AUTH_MOJOAUTH_ID && process.env.AUTH_MOJOAUTH_SECRET && process.env.AUTH_SECRET,
);

export const { handlers, auth } = NextAuth({
  trustHost: true,
  providers: loginEnabled
    ? [
        {
          id: "mojoauth",
          name: "MojoAuth",
          type: "oidc",
          // e.g. https://<project>.auth.mojoauth.com (no trailing slash; must match its discovery document)
          issuer: process.env.AUTH_MOJOAUTH_ISSUER,
          clientId: process.env.AUTH_MOJOAUTH_ID,
          clientSecret: process.env.AUTH_MOJOAUTH_SECRET,
          authorization: { params: { scope: "openid email profile" } },
          // As in MojoAuth's Next.js guide: PKCE is mandatory there, and the secret is sent in the request body.
          checks: ["pkce", "state"],
          client: { token_endpoint_auth_method: "client_secret_post" },
        },
      ]
    : [],
  callbacks: {
    // Expose MojoAuth's stable user id (the token "sub") so saved plans don't depend on the email claim.
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
