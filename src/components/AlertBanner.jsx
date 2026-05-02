export default function AlertBanner({ count }) {
  if (!count || count === 0) return null;
  return (
    <div style={s.banner}>
      <span style={s.dot}>●</span>
      {count} kritik konteyner
    </div>
  );
}

const s = {
  banner: {
    background: "#ffebee", color: "#d32f2f",
    borderRadius: 12, padding: "12px 16px",
    fontSize: 14, fontWeight: 600,
    display: "flex", alignItems: "center", gap: 8,
    border: "1px solid #ffcdd2",
  },
  dot: { fontSize: 10 },
};
