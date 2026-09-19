import type { CSSProperties } from "react";

import legacyPagesJson from "@/config/legacy-pages.generated.json";
import pagesJson from "@/config/pages.generated.json";
import portalJson from "@/config/portal.json";

export type PortalPageKind = "report" | "dashboard";

export type PortalPage = {
  slug: string;
  title: string;
  description?: string;
  kind: PortalPageKind;
  visibility: "domain" | "public";
  extraViewerDomains?: string[];
  legacy?: boolean;
};

// The publisher validates this JSON with DashboardPortalConfig before deploy.
// Infer its client shape and map every validated color token generically so
// adding a token never requires updating a second TypeScript contract.
export const portalConfig = portalJson;
const authoredPages = pagesJson as PortalPage[];

const authoredKeys = new Set(
  authoredPages.map(page => `${page.kind}:${page.slug}`)
);

export const portalPages: PortalPage[] = [
  ...authoredPages,
  ...(legacyPagesJson as PortalPage[]).filter(
    page => !authoredKeys.has(`${page.kind}:${page.slug}`)
  ),
];

export function pageHref(page: Pick<PortalPage, "kind" | "slug">) {
  return page.kind === "dashboard"
    ? `/dashboards/${page.slug}`
    : `/${page.slug}`;
}

const portalBasePath = process.env.NEXT_PUBLIC_KITE_REPORTS_BASE_PATH ?? "";

export const portalHomeHref = `${portalBasePath}/`;

export function fullPageHref(page: Pick<PortalPage, "kind" | "slug">) {
  return `${portalBasePath}${pageHref(page)}`;
}

function cssVariableName(token: string) {
  return `--${token.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`;
}

const brandColorVariables = Object.fromEntries(
  Object.entries(portalConfig.brand.colors).map(([token, value]) => [
    cssVariableName(token),
    value,
  ])
);

export const brandStyle = {
  ...brandColorVariables,
  "--input": portalConfig.brand.colors.border,
} as CSSProperties;
