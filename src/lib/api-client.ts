import axios from "axios"

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
  withCredentials: true,
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data && typeof error.response.data === "string" && error.response.data.includes("<!DOCTYPE html>")) {
      const match = error.response.data.match(/<pre>(.*?)<\/pre>/)
      const message = match ? match[1] : `HTTP ${error.response.status}: ${error.response.statusText}`
      error.message = message
      error.userMessage = message
    }
    return Promise.reject(error)
  }
)

