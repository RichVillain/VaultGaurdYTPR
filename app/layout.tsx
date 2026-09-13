import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WorkspaceProvider } from "@/components/WorkspaceProvider";
import { Chrome } from "@/components/Chrome";

export const metadata: Metadata = {
  title: "VaultGuard YTPR",
  description: "VaultGuard YouTube research workspace — collect, cluster, and synthesize with Gemini.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#16181d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WorkspaceProvider>
          <Chrome>{children}</Chrome>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
