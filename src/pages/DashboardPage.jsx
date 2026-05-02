import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import AlertBanner from "../components/AlertBanner";
import { getStatus, getOptimalRoute } from "../services/api";

const MOCK_STATUS = { total: 42, critical: 3, normal: 39 };

const MOCK_POINTS = [
  { id: "SB-101", lat: 40.4093, lng: 49.8671, fillLevel: 92, status: "CRITICAL" },
  { id: "SB-103", lat: 40.4150, lng: 49.8600, fillLevel: 85, status: "CRITICAL" },
  { id: "SB-105", lat: 40.4300, lng: 49.8900, fillLevel: 78, status: "NORMAL" }
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    getStatus()
      .then((res) => setData(res))
      .catch(() => setData(MOCK_STATUS))
      .finally(() => setLoading(false));
  }, []);

  const handleRoute = async () => {
    setRouteLoading(true);
    try {
      const res = await getOptimalRoute();
      navigate("/map", { state: { points: res.points } });
    } catch {
      // Mock fallback
      navigate("/map", { state: { points: MOCK_POINTS } });
    } finally {
      setRouteLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <Header />

      <main style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Greeting */}
        <div style={{ paddingTop: 4, paddingLeft: 16, paddingRight: 16 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", marginBottom: 4 }}>Salam, Operatör 👋</h1>
          <p style={{ fontSize: 13, color: "#757575" }}>
            Sistem yeniləndi: Son yoxlanış 2 dəqiqə əvvəl.
          </p>
        </div>

        {/* Alert banner */}
        {data && (
          <div style={{ padding: "0 16px" }}>
            <AlertBanner count={data.critical} />
          </div>
        )}

        {/* Spinner */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <div style={{ width: 32, height: 32, border: "3px solid #e0e0e0", borderTop: "3px solid #2e7d32", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}

        {/* Stat cards */}
        {!loading && data && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <StatCard label="CƏMİ"    value={`${data.total} ədəd`}    color="#111" />
            <StatCard label="KRİTİK"  value={`${data.critical} təcili`} color="#d32f2f" />
            <StatCard label="NORMAL"  value={`${data.normal} stabil`}  color="#2e7d32" />
          </div>
        )}
      </main>

      {/* Fixed bottom button */}
      <div className="bottom-button">
        <button onClick={handleRoute} disabled={routeLoading}>
          <span style={{ fontSize: 18 }}>🗺</span>
          {routeLoading ? "Hesablanır..." : "Optimal marşrutu hesabla"}
        </button>
      </div>
    </div>
  );
}
