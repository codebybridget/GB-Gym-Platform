import axios from "axios"

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
})

export const requestMemberPasswordReset = async (email) => {
  const response = await api.post("/auth/forgot-password", {
    email,
  })
  return response.data
}

export const requestAdminPasswordReset = async (email) => {
  const response = await api.post("/admin-auth/forgot-password", {
    email,
  })
  return response.data
}

export const resetPassword = async ({ token, role, password }) => {
  const response = await api.post("/auth/reset-password", {
    token,
    role,
    password,
  })
  return response.data
}
