import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import { getToken, setToken } from "../services/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) navigate("/dashboard", { replace: true });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const token = await loginUser(username, password);
      localStorage.setItem("bingo_token", token);

      // COMMENT OUT stationIds — backend does not return it yet
      // localStorage.setItem("bingo_stations", JSON.stringify(data.stationIds));

      navigate("/dashboard", { replace: true });
    } catch (err) {
      // network error - try mock
      if (username === "admin" && password === "admin123") {
        localStorage.setItem("bingo_token", "mock-jwt-token");
        localStorage.setItem("bingo_username", "Admin");
        navigate("/dashboard", { replace: true });
        return;
      }
      setError("İstifadəçi adı və ya şifrə yanlışdır");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div style={{ display: "flex", justifyContent: "center" }}>
          <img src="/logo.png" alt="BinGo" style={{ height: "80px", objectFit: "contain", marginBottom: "16px" }} />
        </div>
        <p style={{ textAlign: "center", color: "#757575", fontSize: 14, marginBottom: 28 }}>Hesabınıza daxil olun</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#424242" }}>İstifadəçi adı</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="İstifadəçi adını daxil edin"
              required
              style={{ padding: "12px 14px", border: "1.5px solid #e0e0e0", background: "#fafafa" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#424242" }}>Şifrə</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrəni daxil edin"
              required
              style={{ padding: "12px 14px", border: "1.5px solid #e0e0e0", background: "#fafafa" }}
            />
          </div>

          {error && (
            <div style={{ color: "#d32f2f", fontSize: 13, textAlign: "center", background: "#ffebee", borderRadius: 8, padding: "10px 14px" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="login-button">
            {loading ? "Yüklənir..." : "Daxil ol"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 12, color: "#bdbdbd", marginTop: 20 }}>Demo: admin / admin123</p>
      </div>
    </div>
  );
}
