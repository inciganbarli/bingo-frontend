import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Header from "../components/Header";
import { getToken } from "../services/auth";

// Fix default icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function getStartIcon() {
  return L.divIcon({
    html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
      <div style="font-size:32px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));">🚩</div>
      <div style="background:#1565c0;color:white;font-size:10px;font-weight:bold;padding:2px 6px;border-radius:4px;margin-top:2px;white-space:nowrap;">Başlanğıc</div>
    </div>`,
    className: "",
    iconSize: [60, 52],
    iconAnchor: [30, 52],
    popupAnchor: [0, -52],
  });
}

function makeIcon(status, index) {
  const isCritical = status === "CRITICAL";
  const color = isCritical ? "#d32f2f" : "#2e7d32";
  const pulse = isCritical
    ? `<div style="
        position:absolute;width:40px;height:40px;top:-6px;left:-6px;
        border-radius:50%;background:rgba(211,47,47,0.3);
        animation:pulse-ring 1.4s ease-out infinite;
      "></div>`
    : "";
  return L.divIcon({
    html: `<div style="position:relative;width:28px;height:28px;">
      ${pulse}
      <div style="
        position:relative;z-index:1;
        width:28px;height:28px;border-radius:50%;
        background:${color};border:2px solid #fff;
        box-shadow:0 2px 6px rgba(0,0,0,0.3);
        display:flex;align-items:center;justify-content:center;
        color:white;font-weight:bold;font-size:13px;
      ">${index}</div>
    </div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function popupHtml(pt) {
  const crit = pt.status === "CRITICAL";
  const color  = crit ? "#d32f2f" : "#2e7d32";
  const bgBadge = crit ? "#ffebee" : "#e8f5e9";
  const badge   = crit ? "KRİTİK" : "NORMAL";
  return `
    <div style="font-family:-apple-system,sans-serif;width:210px;padding:2px 0">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <strong style="font-size:14px;color:#111">ID: ${pt.id}</strong>
        <span style="font-size:10px;font-weight:700;letter-spacing:.5px;
          background:${bgBadge};color:${color};border-radius:6px;padding:2px 8px">
          ${badge}
        </span>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-bottom:10px">
        <span style="font-size:15px;font-weight:700;color:#111">Doluluq: ${pt.fillLevel}%</span>
      </div>
      <div style="background:#eee;border-radius:99px;height:8px;overflow:hidden">
        <div style="height:100%;width:${pt.fillLevel}%;background:${color};border-radius:99px"></div>
      </div>
    </div>`;
}

export default function MapPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState("Məkanınız müəyyənləşdirilir...");
  const [errorMsg, setErrorMsg] = useState("");
  const [routeStatus, setRouteStatus] = useState("");

  const points = location.state?.points ?? [];

  useEffect(() => {
    if (!getToken()) { navigate("/login", { replace: true }); return; }
    if (mapInstance.current) return;
    if (points.length === 0) {
      setLoading(false);
      return;
    }

    const map = L.map(mapRef.current, {
      center: [40.4093, 49.8671],
      zoom: 13,
      zoomControl: false,
    });

    // Dark CartoDB tiles
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }
    ).addTo(map);

    // Zoom controls (top-right)
    L.control.zoom({ position: "topright" }).addTo(map);

    // Location button (top-right)
    const LocControl = L.Control.extend({
      options: { position: "topright" },
      onAdd() {
        const btn = L.DomUtil.create("button");
        btn.innerHTML = "📍";
        btn.title = "Mənim mövqeyim";
        btn.style.cssText =
          "width:34px;height:34px;margin-top:6px;border-radius:6px;" +
          "border:2px solid rgba(255,255,255,0.2);background:rgba(40,40,40,0.85);" +
          "color:#fff;font-size:16px;cursor:pointer;display:block;";
        L.DomEvent.on(btn, "click", () => {
          navigator.geolocation?.getCurrentPosition(({ coords }) =>
            map.setView([coords.latitude, coords.longitude], 15)
          );
        });
        return btn;
      },
    });
    new LocControl().addTo(map);

    mapInstance.current = map;

    async function proceedWithRoute(userLat, userLng) {
      setLoadingMsg("Yol hesablanır...");
      
      const startPoint = { lat: userLat, lng: userLng };
      const criticalPoints = points.filter(p => p.status === "CRITICAL");
      const normalPoints = points.filter(p => p.status !== "CRITICAL");
      
      const allMarkers = [];
      
      // Always draw Start marker
      const startMarker = L.marker([startPoint.lat, startPoint.lng], { icon: getStartIcon() })
        .bindPopup(`<div style="font-family:sans-serif;font-size:14px;padding:4px;text-align:center;"><strong>🚩 Başlanğıc nöqtəsi</strong><br/><span style="color:#666">Sizin məkanınız</span></div>`)
        .addTo(map);
      allMarkers.push(startMarker);

      // If no critical bins, draw normals and abort OSRM
      if (criticalPoints.length === 0) {
        normalPoints.forEach(pt => {
          const idx = points.indexOf(pt) + 1;
          const marker = L.marker([pt.lat, pt.lng], { icon: makeIcon(pt.status, idx) })
            .bindPopup(popupHtml(pt), { maxWidth: 250 })
            .addTo(map);
          allMarkers.push(marker);
        });

        const group = L.featureGroup(allMarkers);
        map.fitBounds(group.getBounds().pad(0.15));

        setLoading(false);
        setRouteInfo({ distance: 0, duration: 0, criticalCount: 0 });
        setRouteStatus("Hazırda kritik konteyner yoxdur ✓");
        return;
      }

      // Draw Route for critical bins using /trip
      const routePoints = [startPoint, ...criticalPoints];
      
      try {
        const coords = routePoints.map(p => `${p.lng},${p.lat}`).join(";");
        const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?overview=full&geometries=geojson&source=first&roundtrip=false`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error("OSRM failed");
        const data = await res.json();
        
        if (!data.trips || !data.trips[0]) throw new Error("No trip found");
        
        const trip = data.trips[0];
        const geometry = trip.geometry.coordinates;
        const routeLatLngs = geometry.map(c => [c[1], c[0]]);
        
        // Draw critical markers with optimized OSRM waypoint indices
        criticalPoints.forEach((pt, i) => {
          // data.waypoints[i + 1] corresponds to criticalPoints[i] since [0] is start
          const optimizedOrder = data.waypoints[i + 1].waypoint_index;
          const marker = L.marker([pt.lat, pt.lng], { icon: makeIcon(pt.status, optimizedOrder) })
            .bindPopup(popupHtml(pt), { maxWidth: 250 })
            .addTo(map);
          allMarkers.push(marker);
        });

        // Draw normal markers with their original list index
        normalPoints.forEach(pt => {
          const idx = points.indexOf(pt) + 1;
          const marker = L.marker([pt.lat, pt.lng], { icon: makeIcon(pt.status, idx) })
            .bindPopup(popupHtml(pt), { maxWidth: 250 })
            .addTo(map);
          allMarkers.push(marker);
        });

        // Auto-fit map to all markers
        const group = L.featureGroup(allMarkers);
        map.fitBounds(group.getBounds().pad(0.15));
        
        const distanceKm = (trip.distance / 1000).toFixed(1);
        const durationMin = Math.round(trip.duration / 60);
        const criticalCount = criticalPoints.length;
        
        setRouteInfo({ distance: distanceKm, duration: durationMin, criticalCount });
        setLoading(false);
        setRouteStatus("Marşrut çəkilir...");
        
        let i = 0;
        const polyline = L.polyline([], { color: "#2e7d32", weight: 5, opacity: 0.8 }).addTo(map);
        const interval = setInterval(() => {
          if (i >= routeLatLngs.length) {
            clearInterval(interval);
            setRouteStatus("Marşrut hazırdır ✓");
            return;
          }
          polyline.addLatLng(routeLatLngs[i]);
          i++;
        }, 30);
        
      } catch (err) {
        // Fallback to straight line
        criticalPoints.forEach((pt, i) => {
          const marker = L.marker([pt.lat, pt.lng], { icon: makeIcon(pt.status, i + 1) })
            .bindPopup(popupHtml(pt), { maxWidth: 250 })
            .addTo(map);
          allMarkers.push(marker);
        });
        normalPoints.forEach(pt => {
          const idx = points.indexOf(pt) + 1;
          const marker = L.marker([pt.lat, pt.lng], { icon: makeIcon(pt.status, idx) })
            .bindPopup(popupHtml(pt), { maxWidth: 250 })
            .addTo(map);
          allMarkers.push(marker);
        });

        const group = L.featureGroup(allMarkers);
        map.fitBounds(group.getBounds().pad(0.15));

        setLoading(false);
        setErrorMsg("Sadələşdirilmiş marşrut göstərilir");
        const fallbackLatLngs = routePoints.map(pt => [pt.lat, pt.lng]);
        L.polyline(fallbackLatLngs, { color: "#1e88e5", weight: 4, opacity: 0.8, dashArray: "6 4" }).addTo(map);
      }
    }

    // Attempt geolocation
    navigator.geolocation.getCurrentPosition(
      (position) => {
        proceedWithRoute(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        proceedWithRoute(40.4093, 49.8671);
      }
    );

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  return (
    <div className="map-page">
      <div className="map-header">
        <Header />
      </div>
      <div className="map-container">
        <div ref={mapRef} style={{ width: "100%", height: "100%", zIndex: 1 }} />
        
        {loading && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "white", padding: "20px 32px", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
              <div style={{ width: 32, height: 32, border: "3px solid #e0e0e0", borderTop: "3px solid #2e7d32", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <p style={{ marginTop: 12, fontWeight: 600 }}>{loadingMsg}</p>
            </div>
          </div>
        )}
        
        {errorMsg && (
          <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", background: "#ff9800", color: "white", padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: "bold", zIndex: 1000, boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>⚠️ {errorMsg}</div>
        )}
        
        {!loading && routeInfo && (
          <div className="route-info-card">
            <div>
              <h3 style={{ fontSize: 16, fontWeight: "bold", margin: "0 0 8px 0" }}>🗺️ Optimal Marşrut</h3>
              <p style={{ fontSize: 14, color: "#333", margin: "4px 0" }}>{routeInfo.criticalCount} kritik konteyner</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 14, color: "#333", margin: "4px 0" }}>📍 Ümumi məsafə: {routeInfo.distance} km</p>
              <p style={{ fontSize: 14, color: "#333", margin: "4px 0" }}>⏱️ Təxmini vaxt: {routeInfo.duration} dəq</p>
              {routeStatus && <div style={{ fontSize: 12, color: "#2e7d32", fontWeight: "bold", marginTop: 8, textAlign: "right" }}>{routeStatus}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
