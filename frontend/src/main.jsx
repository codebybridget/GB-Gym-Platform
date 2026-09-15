import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App.jsx"
import { AuthProvider } from "./context/AuthContext.jsx"
import { GymProvider } from "./context/GymContext.jsx"
import { ThemeProvider } from "./context/ThemeContext.jsx"
import "./index.css"
import "./App.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <GymProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </GymProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)


if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Push notifications remain opt-in; registration failure must not block the app.
    })
  })
}
