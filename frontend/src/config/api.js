import { API_URL } from "./constants";

export const ENDPOINTS = {
  LOGIN: `${API_URL}/api/auth/login`,
  REGISTER: `${API_URL}/api/auth/register`,
  FORGOT_PASSWORD: `${API_URL}/api/auth/forgot-password`,
  RESET_PASSWORD: `${API_URL}/api/auth/reset-password`,
  GET_USER: `${API_URL}/api/users/me`,
  GET_PROFILE: `${API_URL}/api/users`,
  FAVORITES: `${API_URL}/api/favorites`,
};

export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
