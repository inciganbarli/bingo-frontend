// ⚠️ Backend teammate — login endpoint must return:
// { token: string, stationIds: string[] }
// Route endpoint receives stationIds in body,
// looks up each station's current data from DB,
// returns points array with lat/lng/fillLevel/status
// CORS must be open for localhost:5174

import { getToken } from "./auth";

const BASE_URL = "http://localhost:8080/api";

export const loginUser = async (username, password) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const json = await res.json();  // BaseResponse
  if (!json.success) throw new Error("Login failed");
  return json.data;  // just the token string
};

export const getStatus = async () => {
  const token = localStorage.getItem("bingo_token");
  const res = await fetch(`${BASE_URL}/bins/status`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });
  const json = await res.json();  // BaseResponse
  if (!json.success) throw new Error("Status failed");
  return json.data;  // { total, critical, normal }
};

export const getOptimalRoute = async () => {
  const token = localStorage.getItem("bingo_token");

  // stationIds removed — backend will determine stations from token
  const res = await fetch(`${BASE_URL}/route/optimal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
    // no body needed — backend reads driver info from JWT token
  });
  const json = await res.json();  // BaseResponse
  if (!json.success) throw new Error("Route failed");
  return json.data;  // { points: [...] }
};
