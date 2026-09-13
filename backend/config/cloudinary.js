import dotenv from "dotenv"
import path from "path"

import {
  v2 as cloudinary,
} from "cloudinary"

/*
|--------------------------------------------------------------------------
| Load Backend .env Explicitly
|--------------------------------------------------------------------------
|
| We explicitly point dotenv to:
|
| C:\Users\USER\Desktop\GB\backend\.env
|
| This prevents Cloudinary from starting before the backend environment
| variables have been loaded.
|
|--------------------------------------------------------------------------
*/

dotenv.config({
  path: path.resolve(
    process.cwd(),
    ".env",
  ),
})

/*
|--------------------------------------------------------------------------
| Read Cloudinary Credentials
|--------------------------------------------------------------------------
*/

const cloudName =
  process.env.CLOUDINARY_CLOUD_NAME

const apiKey =
  process.env.CLOUDINARY_API_KEY

const apiSecret =
  process.env.CLOUDINARY_API_SECRET

/*
|--------------------------------------------------------------------------
| Validate Configuration
|--------------------------------------------------------------------------
*/

if (!cloudName) {
  console.error(
    "❌ CLOUDINARY_CLOUD_NAME is missing.",
  )
}

if (!apiKey) {
  console.error(
    "❌ CLOUDINARY_API_KEY is missing.",
  )
}

if (!apiSecret) {
  console.error(
    "❌ CLOUDINARY_API_SECRET is missing.",
  )
}

/*
|--------------------------------------------------------------------------
| Configure Cloudinary
|--------------------------------------------------------------------------
*/

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
})

/*
|--------------------------------------------------------------------------
| Safe Configuration Check
|--------------------------------------------------------------------------
|
| We deliberately do NOT print the API key or API secret.
|
|--------------------------------------------------------------------------
*/

if (
  cloudName &&
  apiKey &&
  apiSecret
) {
  console.log(
    "✅ Cloudinary configuration loaded successfully.",
  )
} else {
  console.error(
    "❌ Cloudinary configuration is incomplete.",
  )
}

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export default cloudinary