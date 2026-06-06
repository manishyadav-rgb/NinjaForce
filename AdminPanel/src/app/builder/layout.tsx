export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Builder uses its own full-screen layout (no AdminShell sidebar)
  return <>{children}</>;
}
