import {
  Bell,
  CheckCheck,
  Dumbbell,
  X,
} from "lucide-react"

import {
  useEffect,
  useState,
} from "react"

import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications.js"

function formatNotificationDate(
  value,
) {
  if (!value) {
    return ""
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return ""
  }

  return date.toLocaleString(
    "en-NG",
    {
      dateStyle:
        "medium",
      timeStyle:
        "short",
    },
  )
}

export default function NotificationBell() {
  const [
    open,
    setOpen,
  ] = useState(false)

  const [
    notifications,
    setNotifications,
  ] = useState([])

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0)

  const [
    loading,
    setLoading,
  ] = useState(false)

  async function loadNotifications() {
    try {
      setLoading(true)

      const result =
        await getMyNotifications()

      setNotifications(
        Array.isArray(
          result?.notifications,
        )
          ? result.notifications
          : [],
      )

      setUnreadCount(
        Number(
          result?.unreadCount ||
            0,
        ),
      )
    } catch (error) {
      console.error(
        "Unable to load notifications:",
        error,
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()

    const interval =
      setInterval(
        loadNotifications,
        60 * 1000,
      )

    return () =>
      clearInterval(
        interval,
      )
  }, [])

  async function handleRead(
    notification,
  ) {
    try {
      await markNotificationRead(
        notification._id,
      )

      setNotifications(
        (current) =>
          current.map(
            (item) =>
              item._id ===
              notification._id
                ? {
                    ...item,
                    read: true,
                  }
                : item,
          ),
      )

      setUnreadCount(
        (current) =>
          notification.read
            ? current
            : Math.max(
                0,
                current - 1,
              ),
      )
    } catch (error) {
      console.error(
        "Unable to mark notification read:",
        error,
      )
    }
  }

  async function handleReadAll() {
    try {
      await markAllNotificationsRead()

      setNotifications(
        (current) =>
          current.map(
            (item) => ({
              ...item,
              read: true,
            }),
          ),
      )

      setUnreadCount(0)
    } catch (error) {
      console.error(
        "Unable to mark all notifications read:",
        error,
      )
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() =>
          setOpen(
            (current) =>
              !current,
          )
        }
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/15"
        aria-label="Notifications"
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-400 px-1 text-[9px] font-black text-black">
            {unreadCount >
            9
              ? "9+"
              : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() =>
              setOpen(false)
            }
            className="fixed inset-0 z-40 cursor-default"
          />

          <div className="absolute right-0 z-50 mt-3 w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-3xl border border-white/10 bg-[#111111] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-400">
                  GB
                </p>
                <h2 className="mt-1 text-lg font-black text-white">
                  Notifications
                </h2>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount >
                  0 && (
                  <button
                    type="button"
                    onClick={
                      handleReadAll
                    }
                    className="rounded-xl p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
                    title="Mark all as read"
                  >
                    <CheckCheck
                      size={18}
                    />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setOpen(false)
                  }
                  className="rounded-xl p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="max-h-[430px] overflow-y-auto">
              {loading &&
              notifications.length ===
                0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  Loading notifications...
                </div>
              ) : notifications.length ===
                0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-gray-500">
                    <Bell
                      size={20}
                    />
                  </div>
                  <p className="mt-3 text-sm font-bold text-gray-400">
                    No notifications yet.
                  </p>
                </div>
              ) : (
                notifications.map(
                  (
                    notification,
                  ) => (
                    <button
                      type="button"
                      key={
                        notification._id
                      }
                      onClick={() =>
                        handleRead(
                          notification,
                        )
                      }
                      className={`flex w-full gap-3 border-b border-white/5 p-4 text-left transition hover:bg-white/5 ${
                        notification.read
                          ? "bg-transparent"
                          : "bg-lime-400/[0.04]"
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-400 text-black">
                        <Dumbbell
                          size={18}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-black text-white">
                            {
                              notification.title
                            }
                          </p>

                          {!notification.read && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-lime-400" />
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          {
                            notification.message
                          }
                        </p>

                        <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-gray-700">
                          {formatNotificationDate(
                            notification.createdAt,
                          )}
                        </p>
                      </div>
                    </button>
                  ),
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
