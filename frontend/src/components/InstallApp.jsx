import { useEffect, useState } from "react"

export default function InstallApp({ gymName = "GB Fitness" }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true

    setInstalled(standalone)

    const beforeInstall = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
    }

    const installedHandler = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", beforeInstall)
    window.addEventListener("appinstalled", installedHandler)

    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall)
      window.removeEventListener("appinstalled", installedHandler)
    }
  }, [])

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
      return
    }

    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent)
    if (isIos) setShowIosHelp(true)
  }

  if (installed) {
    return (
      <div className="card" style={{ marginTop: 16 }}>
        <strong>GB is installed</strong>
        <p className="muted" style={{ marginTop: 6 }}>
          Open the GB app from your phone to return to {gymName}.
        </p>
      </div>
    )
  }

  if (!deferredPrompt && !/iphone|ipad|ipod/i.test(window.navigator.userAgent)) {
    return null
  }

  return (
    <>
      <button
        type="button"
        className="btn ghost"
        onClick={install}
        style={{ width: "100%", marginTop: 10 }}
      >
        Install GB App
      </button>

      {showIosHelp && (
        <div className="card" style={{ marginTop: 12 }}>
          <strong>Install GB on iPhone/iPad</strong>
          <p className="muted" style={{ marginTop: 6 }}>
            In Safari, tap Share, choose <b>Add to Home Screen</b>, then tap
            Add. Open GB from your home screen to use it like an app.
          </p>
          <button
            type="button"
            className="btn ghost"
            onClick={() => setShowIosHelp(false)}
            style={{ marginTop: 8 }}
          >
            Close
          </button>
        </div>
      )}
    </>
  )
}
