import {
  useState,
} from "react"

function urlBase64ToUint8Array(
  base64String,
) {
  const padding =
    "=".repeat(
      (4 -
        (base64String.length % 4)) %
        4,
    )

  const base64 =
    (
      base64String +
      padding
    )
      .replace(
        /-/g,
        "+",
      )
      .replace(
        /_/g,
        "/",
      )

  const rawData =
    window.atob(base64)

  return Uint8Array.from(
    [...rawData].map(
      (char) =>
        char.charCodeAt(0),
    ),
  )
}

function getApiBaseUrl() {
  return (
    import.meta.env.VITE_API_URL ||
    "https://gb-gym-platform.onrender.com/api"
  ).replace(/\/+$/, "")
}

function getAccessToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    ""
  )
}

export default function PushTest() {
  const [status, setStatus] =
    useState(
      "Ready to test device notifications.",
    )

  const [testing, setTesting] =
    useState(false)

  const runPushTest = async () => {
    if (testing) return

    setTesting(true)
    setStatus(
      "Preparing your device notification subscription...",
    )

    try {
      if (!("serviceWorker" in navigator)) {
        throw new Error(
          "This browser does not support service workers.",
        )
      }

      if (!("PushManager" in window)) {
        throw new Error(
          "This browser does not support push notifications.",
        )
      }

      if (!("Notification" in window)) {
        throw new Error(
          "This browser does not support notifications.",
        )
      }

      const token = getAccessToken()

      if (!token) {
        throw new Error(
          "Your GB login session was not found. Please log in again.",
        )
      }

      if (Notification.permission === "denied") {
        throw new Error(
          "Notifications are blocked for localhost. Allow notifications in Edge site settings, then try again.",
        )
      }

      if (Notification.permission === "default") {
        const permission =
          await Notification.requestPermission()

        if (permission !== "granted") {
          throw new Error(
            "Notification permission was not granted.",
          )
        }
      }

      const registration =
        await navigator.serviceWorker.register(
          "/sw.js",
        )

      await navigator.serviceWorker.ready

      let subscription =
        await registration.pushManager.getSubscription()

      if (!subscription) {
        setStatus(
          "Getting GB push notification access...",
        )

        const keyResponse =
          await fetch(
            `${getApiBaseUrl()}/notifications/push/public-key`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          )

        const keyData =
          await keyResponse.json()

        if (
          !keyResponse.ok ||
          !keyData?.publicKey
        ) {
          throw new Error(
            keyData?.message ||
              "GB could not provide the push notification key.",
          )
        }

        subscription =
          await registration.pushManager.subscribe(
            {
              userVisibleOnly: true,
              applicationServerKey:
                urlBase64ToUint8Array(
                  keyData.publicKey,
                ),
            },
          )
      }

      setStatus(
        "Registering this device with GB...",
      )

      const subscribeResponse =
        await fetch(
          `${getApiBaseUrl()}/notifications/push/subscribe`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              subscription:
                subscription.toJSON(),
            }),
          },
        )

      const subscribeData =
        await subscribeResponse.json()

      if (!subscribeResponse.ok) {
        throw new Error(
          subscribeData?.message ||
            "GB could not register this device.",
        )
      }

      setStatus(
        "Device registered. Sending the real backend push now...",
      )

      const testResponse =
        await fetch(
          `${getApiBaseUrl()}/notifications/push/test`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        )

      const testData =
        await testResponse.json()

      if (!testResponse.ok) {
        throw new Error(
          testData?.message ||
            "The backend test push failed.",
        )
      }

      setStatus(
        `SUCCESS — backend sent ${testData.sent || 0} push notification(s). Check your device.`,
      )
    } catch (error) {
      console.error(
        "GB push test error:",
        error,
      )

      setStatus(
        `FAILED — ${
          error?.message ||
          "Unable to test device notifications."
        }`,
      )
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-400">
            GB Device Notifications
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Test Workout Notifications
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            This test registers this browser with GB
            and sends a real push notification from
            the GB backend.
          </p>

          <button
            type="button"
            onClick={runPushTest}
            disabled={testing}
            className="mt-6 w-full rounded-xl bg-lime-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {testing
              ? "Testing..."
              : "Send Test Push Notification"}
          </button>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Test status
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              {status}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
