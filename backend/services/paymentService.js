import axios from "axios"

/*
|--------------------------------------------------------------------------
| Paystack Configuration
|--------------------------------------------------------------------------
*/

const PAYSTACK_BASE_URL =
  "https://api.paystack.co"

const getPaystackSecretKey =
  () => {
    const key =
      process.env.PAYSTACK_SECRET_KEY

    if (!key) {
      throw new Error(
        "PAYSTACK_SECRET_KEY is not configured.",
      )
    }

    return key
  }


/*
|--------------------------------------------------------------------------
| Initialize Paystack Transaction
|--------------------------------------------------------------------------
*/

export const initializePaystackTransaction =
  async ({
    email,
    amount,
    reference,
    callbackUrl,
    metadata,
  }) => {
    if (!email) {
      throw new Error(
        "Customer email is required.",
      )
    }

    if (
      amount === undefined ||
      amount === null ||
      Number(amount) <= 0
    ) {
      throw new Error(
        "A valid payment amount is required.",
      )
    }

    if (!reference) {
      throw new Error(
        "Payment reference is required.",
      )
    }

    const response =
      await axios.post(
        `${PAYSTACK_BASE_URL}/transaction/initialize`,
        {
          email,
          amount: Math.round(
            Number(amount) * 100,
          ),
          reference,
          callback_url:
            callbackUrl ||
            undefined,
          metadata:
            metadata || {},
        },
        {
          headers: {
            Authorization:
              `Bearer ${getPaystackSecretKey()}`,

            "Content-Type":
              "application/json",
          },
          timeout: 15000,
        },
      )

    return response.data
  }


/*
|--------------------------------------------------------------------------
| Verify Paystack Transaction
|--------------------------------------------------------------------------
*/

export const verifyPaystackTransaction =
  async (
    reference,
  ) => {
    if (!reference) {
      throw new Error(
        "Payment reference is required.",
      )
    }

    const response =
      await axios.get(
        `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(
          reference,
        )}`,
        {
          headers: {
            Authorization:
              `Bearer ${getPaystackSecretKey()}`,

            "Content-Type":
              "application/json",
          },
          timeout: 15000,
        },
      )

    return response.data
  }


/*
|--------------------------------------------------------------------------
| Get Paystack Transaction
|--------------------------------------------------------------------------
*/

export const getPaystackTransaction =
  async (
    transactionId,
  ) => {
    if (!transactionId) {
      throw new Error(
        "Transaction ID is required.",
      )
    }

    const response =
      await axios.get(
        `${PAYSTACK_BASE_URL}/transaction/${transactionId}`,
        {
          headers: {
            Authorization:
              `Bearer ${getPaystackSecretKey()}`,

            "Content-Type":
              "application/json",
          },
          timeout: 15000,
        },
      )

    return response.data
  }


/*
|--------------------------------------------------------------------------
| Convert NGN to Paystack Minor Unit
|--------------------------------------------------------------------------
|
| ₦20,000 becomes 2,000,000 kobo.
|--------------------------------------------------------------------------
*/

export const toPaystackAmount =
  (amount) => {
    const numericAmount =
      Number(amount)

    if (
      !Number.isFinite(
        numericAmount,
      ) ||
      numericAmount <= 0
    ) {
      throw new Error(
        "Invalid payment amount.",
      )
    }

    return Math.round(
      numericAmount * 100,
    )
  }


/*
|--------------------------------------------------------------------------
| Convert Paystack Minor Unit Back to NGN
|--------------------------------------------------------------------------
*/

export const fromPaystackAmount =
  (amount) => {
    const numericAmount =
      Number(amount)

    if (
      !Number.isFinite(
        numericAmount,
      )
    ) {
      return 0
    }

    return numericAmount / 100
  }