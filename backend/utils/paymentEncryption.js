import crypto from "node:crypto"

const algorithm = "aes-256-gcm"

const getKey = () => {
  const configured = String(
    process.env.PAYMENT_ENCRYPTION_KEY || "",
  ).trim()

  if (!configured) {
    throw new Error(
      "PAYMENT_ENCRYPTION_KEY is not configured.",
    )
  }

  if (/^[0-9a-fA-F]{64}$/.test(configured)) {
    return Buffer.from(configured, "hex")
  }

  return crypto
    .createHash("sha256")
    .update(configured)
    .digest()
}

export const encryptPaymentSecret = (value) => {
  const plainText = String(value || "").trim()

  if (!plainText) {
    return ""
  }

  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(
    algorithm,
    getKey(),
    iv,
  )

  const ciphertext = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    ciphertext.toString("hex"),
  ].join(":")
}

export const decryptPaymentSecret = (encryptedValue) => {
  const value = String(encryptedValue || "").trim()

  if (!value) {
    return ""
  }

  const [ivHex, authTagHex, ciphertextHex] = value.split(":")

  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error("Invalid encrypted payment secret format.")
  }

  const decipher = crypto.createDecipheriv(
    algorithm,
    getKey(),
    Buffer.from(ivHex, "hex"),
  )

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"))

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]).toString("utf8")
}

export const isPaymentEncryptionConfigured = () =>
  Boolean(String(process.env.PAYMENT_ENCRYPTION_KEY || "").trim())
