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
          gap: "var(--spacing-md)",
          flexWrap: "wrap",
        }}
      >
        <strong>TODO: devconsole layout (stub)</strong>
        <Link to="/homepage" style={{ color: "white" }}>Home</Link>
        <Link to="/ruleviewer" style={{ color: "white" }}>RuleViewer</Link>
        <Link to="/sql-visualizer" style={{ color: "white" }}>SQLVisualizer</Link>
        <Link to="/sudoku" style={{ color: "white" }}>Sudoku</Link>
        <Link to="/dev/rule-view" style={{ color: "white" }}>Dev</Link>
        <Link to="/login" style={{ color: "white" }}>Login</Link>
      </header>
      <main style={{ flex: 1, padding: "var(--spacing-md)", overflow: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default HomeLayout;
