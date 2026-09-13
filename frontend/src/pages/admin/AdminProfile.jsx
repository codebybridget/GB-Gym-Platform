import {
  useEffect,
  useState,
} from "react"

import {
  Camera,
  Check,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import {
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
} from "../../api/api.js"

function AdminProfile() {
  const [profile, setProfile] =
    useState({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "admin",
      profilePhoto: "",
    })

  const [photoFile, setPhotoFile] =
    useState(null)

  const [photoPreview, setPhotoPreview] =
    useState("")

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [photoUploading, setPhotoUploading] =
    useState(false)

  const [error, setError] =
    useState("")

  const [success, setSuccess] =
    useState("")

  /*
  |--------------------------------------------------------------------------
  | Load Admin Profile
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadProfile =
      async () => {
        try {
          setLoading(true)
          setError("")

          const response =
            await getMyProfile()

          const user =
            response?.user ||
            response?.profile ||
            response

          if (!user) {
            throw new Error(
              "Unable to load administrator profile.",
            )
          }

          const nextProfile = {
            firstName:
              user.firstName || "",
            lastName:
              user.lastName || "",
            email:
              user.email || "",
            phone:
              user.phone || "",
            role:
              user.role || "admin",
            profilePhoto:
              user.profilePhoto || "",
          }

          setProfile(
            nextProfile,
          )

          setPhotoPreview(
            nextProfile.profilePhoto,
          )
        } catch (profileError) {
          console.error(
            "Admin profile loading error:",
            profileError,
          )

          setError(
            profileError?.response?.data?.message ||
              profileError?.message ||
              "Unable to load administrator profile.",
          )
        } finally {
          setLoading(false)
        }
      }

    loadProfile()
  }, [])

  /*
  |--------------------------------------------------------------------------
  | Input Change
  |--------------------------------------------------------------------------
  */

  const handleChange = (
    event,
  ) => {
    const {
      name,
      value,
    } = event.target

    setProfile(
      (current) => ({
        ...current,
        [name]: value,
      }),
    )

    setSuccess("")
    setError("")
  }

  /*
  |--------------------------------------------------------------------------
  | Select Profile Photo
  |--------------------------------------------------------------------------
  */

  const handlePhotoSelect = (
    event,
  ) => {
    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }

    if (
      !file.type?.startsWith(
        "image/",
      )
    ) {
      setError(
        "Please select an image file.",
      )

      return
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Profile photo must be 5 MB or smaller.",
      )

      return
    }

    setPhotoFile(file)

    setPhotoPreview(
      URL.createObjectURL(file),
    )

    setError("")
    setSuccess("")
  }

  /*
  |--------------------------------------------------------------------------
  | Cancel Photo
  |--------------------------------------------------------------------------
  */

  const handlePhotoCancel = () => {
    setPhotoFile(null)

    setPhotoPreview(
      profile.profilePhoto ||
        "",
    )

    const input =
      document.getElementById(
        "admin-profile-photo",
      )

    if (input) {
      input.value = ""
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Upload Profile Photo
  |--------------------------------------------------------------------------
  */

  const handlePhotoUpload =
    async () => {
      if (
        !photoFile ||
        photoUploading
      ) {
        return
      }

      try {
        setPhotoUploading(true)
        setError("")
        setSuccess("")

        const response =
          await uploadProfilePhoto(
            photoFile,
          )

        if (
          response?.success === false
        ) {
          throw new Error(
            response?.message ||
              "Unable to upload profile photo.",
          )
        }

        const savedPhoto =
          response?.profilePhoto ||
          response?.user?.profilePhoto ||
          ""

        setProfile(
          (current) => ({
            ...current,
            profilePhoto:
              savedPhoto,
          }),
        )

        setPhotoPreview(
          savedPhoto,
        )

        setPhotoFile(null)

        setSuccess(
          "Profile photo updated successfully.",
        )

        const input =
          document.getElementById(
            "admin-profile-photo",
          )

        if (input) {
          input.value = ""
        }
      } catch (photoError) {
        console.error(
          "Admin profile photo upload error:",
          photoError,
        )

        setError(
          photoError?.response?.data?.message ||
            photoError?.message ||
            "Unable to upload profile photo.",
        )
      } finally {
        setPhotoUploading(false)
      }
    }

  /*
  |--------------------------------------------------------------------------
  | Save Profile
  |--------------------------------------------------------------------------
  */

  const handleSave = async (
    event,
  ) => {
    event.preventDefault()

    if (saving) {
      return
    }

    try {
      setSaving(true)
      setError("")
      setSuccess("")

      const response =
        await updateMyProfile({
          firstName:
            profile.firstName.trim(),
          lastName:
            profile.lastName.trim(),
          phone:
            profile.phone.trim(),
        })

      const savedUser =
        response?.user

      if (savedUser) {
        setProfile(
          (current) => ({
            ...current,
            firstName:
              savedUser.firstName ||
              current.firstName,
            lastName:
              savedUser.lastName ||
              current.lastName,
            email:
              savedUser.email ||
              current.email,
            phone:
              savedUser.phone ||
              "",
            role:
              savedUser.role ||
              current.role,
            profilePhoto:
              savedUser.profilePhoto ||
              current.profilePhoto,
          }),
        )
      }

      setSuccess(
        "Administrator profile saved successfully.",
      )
    } catch (saveError) {
      console.error(
        "Admin profile save error:",
        saveError,
      )

      setError(
        saveError?.response?.data?.message ||
          saveError?.message ||
          "Unable to save administrator profile.",
      )
    } finally {
      setSaving(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Loading Screen
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-black text-white">
        <p className="text-sm font-bold text-gray-500">
          Loading administrator profile...
        </p>
      </div>
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Page
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-full bg-black px-4 py-6 text-white sm:px-6 lg:px-8">

      <main className="mx-auto max-w-5xl">

        {/* ============================================================ */}
        {/* HEADER                                                        */}
        {/* ============================================================ */}

        <div className="mb-8">

          <div className="flex items-center gap-2 text-lime-400">

            <ShieldCheck size={17} />

            <span className="text-[11px] font-black uppercase tracking-[0.18em]">
              Administrator
            </span>

          </div>

          <h1 className="mt-2 text-3xl font-black tracking-tight">
            My Profile
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
            Manage your administrator information and
            profile picture.
          </p>

        </div>


        {/* ============================================================ */}
        {/* MESSAGES                                                      */}
        {/* ============================================================ */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-sm text-lime-400">
            <Check size={17} />
            <span>{success}</span>
          </div>
        )}


        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">

          {/* ========================================================== */}
          {/* PROFILE CARD                                                */}
          {/* ========================================================== */}

          <section className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-6">

            <div className="flex flex-col items-center text-center">

              <div className="relative">

                <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-2 border-lime-400/30 bg-black">

                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Administrator profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound
                      size={55}
                      className="text-gray-700"
                    />
                  )}

                </div>

                <label
                  htmlFor="admin-profile-photo"
                  className="absolute bottom-1 right-1 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-lime-400 text-black shadow-xl transition hover:bg-lime-300"
                  title="Choose profile photo"
                >
                  <Camera size={19} />
                </label>

                <input
                  id="admin-profile-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={
                    handlePhotoSelect
                  }
                  className="hidden"
                />

              </div>


              <h2 className="mt-5 text-xl font-black">
                {profile.firstName ||
                profile.lastName
                  ? `${profile.firstName} ${profile.lastName}`.trim()
                  : "Administrator"}
              </h2>


              <p className="mt-1 text-sm text-gray-500">
                {profile.email}
              </p>


              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-lime-400/20 bg-lime-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-lime-400">

                <ShieldCheck size={13} />

                Administrator

              </div>


              {photoFile && (
                <div className="mt-6 flex w-full gap-2">

                  <button
                    type="button"
                    onClick={
                      handlePhotoUpload
                    }
                    disabled={
                      photoUploading
                    }
                    className="flex-1 rounded-xl bg-lime-400 px-4 py-3 text-xs font-black text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {photoUploading
                      ? "UPLOADING..."
                      : "UPLOAD PHOTO"}
                  </button>

                  <button
                    type="button"
                    onClick={
                      handlePhotoCancel
                    }
                    disabled={
                      photoUploading
                    }
                    className="rounded-xl border border-white/10 bg-black px-4 py-3 text-xs font-black text-gray-400 transition hover:text-white disabled:opacity-60"
                  >
                    CANCEL
                  </button>

                </div>
              )}

            </div>

          </section>


          {/* ========================================================== */}
          {/* INFORMATION                                                 */}
          {/* ========================================================== */}

          <section className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-6">

            <div className="mb-6">

              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-500">
                Account Information
              </p>

              <h2 className="mt-1 text-xl font-black">
                Personal Details
              </h2>

            </div>


            <form
              onSubmit={
                handleSave
              }
              className="space-y-5"
            >

              {/* First Name */}

              <div>

                <label
                  htmlFor="admin-first-name"
                  className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500"
                >
                  First Name
                </label>

                <input
                  id="admin-first-name"
                  name="firstName"
                  type="text"
                  value={
                    profile.firstName
                  }
                  onChange={
                    handleChange
                  }
                  disabled={saving}
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/10 disabled:opacity-60"
                />

              </div>


              {/* Last Name */}

              <div>

                <label
                  htmlFor="admin-last-name"
                  className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500"
                >
                  Last Name
                </label>

                <input
                  id="admin-last-name"
                  name="lastName"
                  type="text"
                  value={
                    profile.lastName
                  }
                  onChange={
                    handleChange
                  }
                  disabled={saving}
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/10 disabled:opacity-60"
                />

              </div>


              {/* Email */}

              <div>

                <label
                  htmlFor="admin-email"
                  className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-500"
                >
                  <Mail size={13} />
                  Email Address
                </label>

                <input
                  id="admin-email"
                  type="email"
                  value={
                    profile.email
                  }
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-white/5 bg -white/[0.03] px-4 py-3 text-sm text-gray-500 outline-none"
                />

                <p className="mt-2 text-[11px] text-gray-700">
                  Your login email is managed by the
                  account system.
                </p>

              </div>


              {/* Phone */}

              <div>

                <label
                  htmlFor="admin-phone"
                  className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-500"
                >
                  <Phone size={13} />
                  Phone Number
                </label>

                <input
                  id="admin-phone"
                  name="phone"
                  type="tel"
                  value={
                    profile.phone
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter phone number"
                  disabled={saving}
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/10 disabled:opacity-60"
                />

              </div>


              {/* Role */}

              <div>

                <label
                  htmlFor="admin-role"
                  className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-500"
                >
                  <LockKeyhole size={13} />
                  Account Role
                </label>

                <input
                  id="admin-role"
                  type="text"
                  value="Administrator"
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-white/5 bg -white/[0.03] px-4 py-3 text-sm font-bold text-lime-400 outline-none"
                />

              </div>


              {/* Save */}

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 py-3.5 text-xs font-black text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Check size={17} />

                {saving
                  ? "SAVING..."
                  : "SAVE PROFILE"}

              </button>

            </form>

          </section>

        </div>

      </main>

    </div>
  )
}

export default AdminProfile