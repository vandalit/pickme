export default function HomePage() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem",
        textAlign: "center",
        gap: "1.5rem",
      }}
    >
      <div style={{ fontSize: "3.5rem" }}>🎯</div>
      <h1
        style={{
          fontSize: "2.5rem",
          fontWeight: 800,
          letterSpacing: "-0.03em",
        }}
      >
        Pick<span style={{ color: "var(--color-brand)" }}>Me</span>
      </h1>
      <p
        style={{
          maxWidth: "480px",
          color: "var(--color-text-secondary)",
          lineHeight: 1.6,
        }}
      >
        Sistema digital de salida escolar con anonimato público y cadena de custodia verificada.
      </p>
    </main>
  );
}

