import type { Metadata } from "next";

import { brandStyle, portalConfig, portalHomeHref } from "@/lib/portal";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${portalConfig.brand.companyName} findings`,
    template: `%s · ${portalConfig.brand.companyName}`,
  },
  description: `Findings and dashboards for ${portalConfig.brand.companyName}.`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={brandStyle}>
      <body>
        <a className="skip-link" href="#portal-content">
          Skip to content
        </a>
        <header className="portal-header">
          <a
            className="portal-brand"
            href={portalHomeHref}
            aria-label="Findings home"
          >
            {portalConfig.brand.logoUrl ? (
              <img src={portalConfig.brand.logoUrl} alt="" />
            ) : null}
            <span>{portalConfig.brand.companyName}</span>
          </a>
        </header>
        <div id="portal-content">{children}</div>
      </body>
    </html>
  );
}
