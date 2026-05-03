const Homepage = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 16,
        userSelect: "none",
      }}
    >
      <span style={{ fontSize: 64 }}>🚧</span>
      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: "#1f2937" }}>
        施工中
      </h2>
      <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
        Under Construction
      </p>
    </div>
  );
};

export default Homepage;
