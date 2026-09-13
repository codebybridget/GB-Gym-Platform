import jwt from "jsonwebtoken"

import User from "../models/User.js"
import Gym from "../models/Gym.js"
import {
  runTenantContext,
} from "./tenantContext.js"

const getToken = (req) => {
  const authHeader =
    req.headers.authorization || ""

  if (
    authHeader.startsWith(
      "Bearer ",
    )
  ) {
    return authHeader.slice(7).trim()
  }

  const cookies =
    req.headers.cookie || ""

  const cookie =
    cookies
      .split(";")
      .map((v) => v.trim())
      .find((v) =>
        v.startsWith(
          "gb_access_token=",
        ),
      )

  return cookie
    ? decodeURIComponent(
        cookie.slice(
          "gb_access_token=".length,
        ),
      )
    : null
}

export const protect =
  async (req, res, next) => {
    try {
      const token =
        getToken(req)

      if (!token) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        })
      }

      if (!process.env.JWT_SECRET) {
        throw new Error(
          "JWT_SECRET is not configured.",
        )
      }

      const payload =
        jwt.verify(
          token,
          process.env.JWT_SECRET,
        )

      if (
        payload?.type &&
        payload.type !== "access"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid access token.",
        })
      }

      const user =
        await User.findById(
          payload.userId,
        )

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "User account could not be found.",
        })
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message:
            "This account has been deactivated.",
        })
      }

      if (
        user.role !==
        "platform_owner"
      ) {
        if (!user.gym) {
          return res.status(403).json({
            success: false,
            message:
              "Your account is not connected to a gym.",
          })
        }

        const gym =
          await Gym.findById(
            user.gym,
          ).lean()

        if (!gym) {
          return res.status(403).json({
            success: false,
            message:
              "Your gym could not be found.",
          })
        }

        if (!gym.isActive) {
          return res.status(403).json({
            success: false,
            code:
              "GYM_SUBSCRIPTION_REQUIRED",
            message:
              "This gym is not active.",
          })
        }
      }

      req.user = user
      req.authProvider = "jwt"
      req.userId = String(
        user._id,
      )
      req.gymId = user.gym
        ? String(user.gym)
        : null

      return runTenantContext(
        {
          gymId:
            user.gym
              ? String(user.gym)
              : null,
          platformOwner:
            user.role ===
            "platform_owner",
        },
        next,
      )
    } catch (error) {
      console.error(
        "JWT authentication error:",
        error,
      )

      return res.status(401).json({
        success: false,
        message:
          "Invalid or expired authentication token.",
      })
    }
  }

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      })
    }

    const userRole =
      String(
        req.user.role || "",
      )
        .trim()
        .toLowerCase()

    const allowedRoles =
      roles.map((role) =>
        String(role)
          .trim()
          .toLowerCase(),
      )

    if (
      !allowedRoles.includes(
        userRole,
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to perform this action.",
        role: userRole || null,
        requiredRoles:
          allowedRoles,
      })
    }

    return next()
  }
}

const adminOnly =
  authorize("admin")

export {
  authorize,
  adminOnly,
}
