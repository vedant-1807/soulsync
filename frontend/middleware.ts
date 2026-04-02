import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

// Protect these routes — unauthenticated users get redirected to /login
export const config = {
  matcher: ["/chat/:path*", "/mood/:path*"],
};
