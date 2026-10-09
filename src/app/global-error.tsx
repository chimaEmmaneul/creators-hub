"use client";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100dvh", margin: 0, padding: 16 }}>
        <title>Something went wrong · CreatorHub Studio</title>
        <main role="alert" style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>CreatorHub Studio is temporarily unavailable</h1>
          <p style={{ color: "#5b6170", marginBottom: 20 }}>
            We couldn&apos;t reach our servers. Your content is safe. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={retry}
            style={{ padding: "10px 18px", borderRadius: 8, border: 0, background: "#4f46e5", color: "white", fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
