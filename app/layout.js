import "./globals.css";
import { ProofFitProvider } from "@/components/providers/prooffit-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata = {
  title: "ProofFit AI",
  description: "Truthful, ATS-safe resume tailoring for data professionals."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="bg-[var(--background)] text-[var(--ink)] antialiased" suppressHydrationWarning>
        <ProofFitProvider>
          <div className="min-h-screen">
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
          </div>
        </ProofFitProvider>
      </body>
    </html>
  );
}
