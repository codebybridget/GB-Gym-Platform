export const money = (v, c = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: String(c || "NGN").toUpperCase(),
    maximumFractionDigits: 0,
  }).format(Number(v) || 0)

export const date = (v) =>
  v
    ? new Date(v).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—"

export const localDate = (v) =>
  v ? new Date(v).toLocaleDateString("en-CA") : " "

export const initials = (v) =>
  String(v || "GB")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase()

export const err = (e) =>
  e?.response?.data?.message ||
  e?.message ||
  "Something went wrong."