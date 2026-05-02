export default function StatCard({ label, value, color }) {
  return (
    <div className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#9e9e9e", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: color || "#111" }}>{value}</span>
    </div>
  );
}
