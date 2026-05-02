import { removeToken } from "../services/auth";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate("/login", { replace: true });
  };

  return (
    <header className="header">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src="/logo.png" alt="BinGo" style={{ height: "36px", objectFit: "contain" }} />
      </div>
      <button style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: 4 }} title="Parametrlər" onClick={handleLogout}>
        ⚙️
      </button>
    </header>
  );
}
