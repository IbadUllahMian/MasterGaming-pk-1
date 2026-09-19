import { fullPageHref, portalPages } from "@/lib/portal";

export default function HomePage() {
  const reportPages = portalPages.filter(
    page => page.kind === "report" && page.visibility === "public"
  );

  return (
    <main className="portal-index">
      <h1>Findings and reports</h1>
      {reportPages.length ? (
        <ul>
          {reportPages.map(page => (
            <li key={`${page.kind}:${page.slug}`}>
              <a href={fullPageHref(page)}>
                <strong>{page.title}</strong>
                {page.description ? <span>{page.description}</span> : null}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p>No findings pages have been published yet.</p>
      )}
    </main>
  );
}
