"use client";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html>
      <body style={{ fontFamily: "sans-serif", padding: "2rem" }}>
        <h2>Error del sistema</h2>
        <pre style={{ background: "#f0f0f0", padding: "1rem", borderRadius: "8px", overflow: "auto" }}>
          {error.message}
          {"\n\n"}
          {error.stack}
        </pre>
      </body>
    </html>
  );
}
