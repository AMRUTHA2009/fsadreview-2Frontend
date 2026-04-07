import api from "./api";

export async function registerUser(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function requestOtp(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function verifyOtp(payload) {
  const { data } = await api.post("/auth/verify-otp", payload);
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data;
}