import mongoose from "mongoose"
import User from "../models/User.js"

/*
|--------------------------------------------------------------------------
| Get Emergency Contacts
|--------------------------------------------------------------------------
*/

const getEmergencyContacts =
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user._id,
        ).select(
          "emergencyContacts",
        )

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Profile not found.",
        })
      }

      return res.status(200).json({
        success: true,
        emergencyContacts:
          user.emergencyContacts,
      })
    } catch (error) {
      console.error(
        "Get emergency contacts error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve emergency contacts.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| Add Emergency Contact
|--------------------------------------------------------------------------
*/

const addEmergencyContact =
  async (req, res) => {
    try {
      const {
        name,
        relationship,
        phone,
        email,
      } = req.body

      if (
        !name?.trim() ||
        !relationship?.trim() ||
        !phone?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, relationship and phone number are required.",
        })
      }

      const user =
        await User.findById(
          req.user._id,
        )

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Profile not found.",
        })
      }

      if (
        user.emergencyContacts
          .length >= 5
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You can have a maximum of 5 emergency contacts.",
        })
      }

      user.emergencyContacts.push({
        name:
          name.trim(),

        relationship:
          relationship.trim(),

        phone:
          phone.trim(),

        email:
          email?.trim()
            .toLowerCase() ||
          "",
      })

      await user.save()

      return res.status(201).json({
        success: true,
        message:
          "Emergency contact added successfully.",
        emergencyContacts:
          user.emergencyContacts,
      })
    } catch (error) {
      console.error(
        "Add emergency contact error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to add emergency contact.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| Update Emergency Contact
|--------------------------------------------------------------------------
*/

const updateEmergencyContact =
  async (req, res) => {
    try {
      const {
        contactId,
      } = req.params

      if (
        !mongoose.Types.ObjectId.isValid(
          contactId,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid emergency contact ID.",
        })
      }

      const {
        name,
        relationship,
        phone,
        email,
      } = req.body

      const user =
        await User.findById(
          req.user._id,
        )

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Profile not found.",
        })
      }

      const contact =
        user.emergencyContacts.id(
          contactId,
        )

      if (!contact) {
        return res.status(404).json({
          success: false,
          message:
            "Emergency contact not found.",
        })
      }

      if (
        name !== undefined
      ) {
        const value =
          String(name).trim()

        if (!value) {
          return res.status(400).json({
            success: false,
            message:
              "Contact name cannot be empty.",
          })
        }

        contact.name =
          value
      }

      if (
        relationship !==
        undefined
      ) {
        const value =
          String(
            relationship,
          ).trim()

        if (!value) {
          return res.status(400).json({
            success: false,
            message:
              "Relationship cannot be empty.",
          })
        }

        contact.relationship =
          value
      }

      if (
        phone !== undefined
      ) {
        const value =
          String(phone).trim()

        if (!value) {
          return res.status(400).json({
            success: false,
            message:
              "Phone number cannot be empty.",
          })
        }

        contact.phone =
          value
      }

      if (
        email !== undefined
      ) {
        contact.email =
          String(email)
            .trim()
            .toLowerCase()
      }

      await user.save()

      return res.status(200).json({
        success: true,
        message:
          "Emergency contact updated successfully.",
        emergencyContacts:
          user.emergencyContacts,
      })
    } catch (error) {
      console.error(
        "Update emergency contact error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to update emergency contact.",
      })
    }
  }

/*
|--------------------------------------------------------------------------
| Delete Emergency Contact
|--------------------------------------------------------------------------
*/

const deleteEmergencyContact =
  async (req, res) => {
    try {
      const {
        contactId,
      } = req.params

      if (
        !mongoose.Types.ObjectId.isValid(
          contactId,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid emergency contact ID.",
        })
      }

      const user =
        await User.findById(
          req.user._id,
        )

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Profile not found.",
        })
      }

      const contact =
        user.emergencyContacts.id(
          contactId,
        )

      if (!contact) {
        return res.status(404).json({
          success: false,
          message:
            "Emergency contact not found.",
        })
      }

      contact.deleteOne()

      await user.save()

      return res.status(200).json({
        success: true,
        message:
          "Emergency contact removed successfully.",
        emergencyContacts:
          user.emergencyContacts,
      })
    } catch (error) {
      console.error(
        "Delete emergency contact error:",
        error,
      )

      return res.status(500).json({
        success: false,
        message:
          "Unable to remove emergency contact.",
      })
    }
  }

export {
  getEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
}