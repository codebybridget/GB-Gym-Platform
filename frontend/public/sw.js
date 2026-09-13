/* GB background workout notification service worker */

self.addEventListener("push", (event) => {
  let data = {}

  try {
    data = event.data
      ? event.data.json()
      : {}
  } catch {
    data = {
      body: event.data
        ? event.data.text()
        : "",
    }
  }

  const title =
    data.title ||
    "GB"

  const uniqueTag =
    data.tag ||
    `gb-push-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`

  const options = {
    body:
      data.body ||
      "It is time for your workout.",
    icon:
      data.icon ||
      "/favicon.ico",
    badge:
      data.badge ||
      "/favicon.ico",
    tag: uniqueTag,
    renotify: true,
    requireInteraction:
      Boolean(data.requireInteraction),
    data: {
      url:
        data.url ||
        "/weekly-schedule",
    },
  }

  event.waitUntil(
    self.registration.showNotification(
      title,
      options,
    ),
  )
})

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close()

    const targetUrl =
      event.notification?.data?.url ||
      "/weekly-schedule"

    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then((clientList) => {
          for (const client of clientList) {
            if ("focus" in client) {
              client.navigate(
                new URL(
                  targetUrl,
                  self.location.origin,
                ).href,
              )

              return client.focus()
            }
          }

          if (clients.openWindow) {
            return clients.openWindow(
              new URL(
                targetUrl,
                self.location.origin,
              ).href,
            )
          }

          return undefined
        }),
    )
  },
)
