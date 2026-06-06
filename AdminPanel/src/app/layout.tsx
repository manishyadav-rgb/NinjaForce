import type { Metadata } from "next";
import "@/styles/globals.css";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "QuirkyHome Admin",
  description: "Admin portal for managing QuirkyHome e-commerce platform.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#f6f6f7]">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
