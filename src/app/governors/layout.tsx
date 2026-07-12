import { requireFullAccess } from "@/lib/auth";

// Gates this section behind full (paid/admin) or guest access; unpaid users
// are redirected to /access. Runs on the server per request.
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireFullAccess();
  return <>{children}</>;
}
