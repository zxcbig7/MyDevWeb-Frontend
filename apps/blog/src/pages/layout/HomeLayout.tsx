import { Outlet, Link } from "react-router-dom";

const HomeLayout = () => {
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          padding: "var(--spacing-md)",
          background: "var(--color-bg-dark)",
          color: "white",
          display: "flex",
          gap: "var(--spacing-lg)",
        }}
      >
        <strong>TODO: blog layout (stub)</strong>
        <Link to="/homepage" style={{ color: "white" }}>Home</Link>
        <Link to="/about" style={{ color: "white" }}>About</Link>
        <Link to="/notes" style={{ color: "white" }}>Notes</Link>
      </header>
      <main style={{ flex: 1, padding: "var(--spacing-md)", overflow: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default HomeLayout;
