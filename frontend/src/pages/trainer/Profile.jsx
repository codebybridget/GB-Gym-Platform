import {
  Award,
  BriefcaseBusiness,
  Camera,
  Check,
  ChevronRight,
  Clock3,
  Edit3,
  Mail,
  MapPin,
  Moon,
  Phone,
  Save,
  ShieldCheck,
  Sun,
  UserRound,
  Users,
  Dumbbell,
  LogOut,
} from "lucide-react"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  useNavigate,
} from "react-router-dom"

import {
  useAuth,
} from "../../context/AuthContext.jsx"

import {
  useTheme,
} from "../../context/ThemeContext.jsx"

import {
  getMe,
  updateMyProfile,
  uploadProfilePhoto,
} from "../../api/api.js"


function getStoredGym() {
  try {
    return JSON.parse(
      localStorage.getItem("gym") || "null",
    )
  } catch {
    return null
  }
}


function getStoredUser() {
  try {
    return JSON.parse(
      localStorage.getItem("user") || "null",
    )
  } catch {
    return null
  }
}


function getFullName(user) {
  const firstName =
    String(user?.firstName || "").trim()

  const lastName =
    String(user?.lastName || "").trim()

  const fullName =
    `${firstName} ${lastName}`.trim()

  return (
    fullName ||
    user?.name ||
    "Trainer"
  )
}


function splitFullName(fullName) {
  const parts =
    String(fullName || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)

  if (!parts.length) {
    return {
      firstName: "",
      lastName: "",
    }
  }

  return {
    firstName: parts[0],
    lastName:
      parts.length > 1
        ? parts.slice(1).join(" ")
        : "",
  }
}


function formatDate(value) {
  if (!value) {
    return "Not available"
  }

  const date =
    new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Not available"
  }

  return date.toLocaleDateString(
    "en-NG",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  )
}


function getInitials(user) {
  const first =
    String(
      user?.firstName || "",
    )
      .trim()
      .charAt(0)

  const last =
    String(
      user?.lastName || "",
    )
      .trim()
      .charAt(0)

  const initials =
    `${first}${last}`.toUpperCase()

  if (initials) {
    return initials
  }

  const name =
    getFullName(user)

  return name
    .split(/\s+/)
    .map(
      (part) =>
        part.charAt(0),
    )
    .join("")
    .slice(0, 2)
    .toUpperCase()
}


function getGymName(user) {
  const storedGym =
    getStoredGym()

  return (
    user?.gymName ||
    user?.gym?.name ||
    storedGym?.name ||
    "Assigned Gym"
  )
}


function getGymLocation(user) {
  const storedGym =
    getStoredGym()

  const gym =
    user?.gym &&
    typeof user.gym === "object"
      ? user.gym
      : storedGym

  if (!gym) {
    return ""
  }

  const parts = [
    gym.city,
    gym.state,
    gym.country,
  ].filter(Boolean)

  return parts.join(", ")
}


function getMediaUrl(value) {
  if (!value) {
    return ""
  }

  const source =
    String(value).trim()

  if (!source) {
    return ""
  }

  if (
    source.startsWith("http://") ||
    source.startsWith("https://") ||
    source.startsWith("data:")
  ) {
    return source
  }

  const configuredApi =
    String(
      import.meta.env.VITE_API_URL || "",
    ).replace(/\/$/, "")

  if (configuredApi) {
    const base =
      configuredApi.endsWith("/api")
        ? configuredApi.slice(0, -4)
        : configuredApi

    return `${base}${source.startsWith("/") ? "" : "/"}${source}`
  }

  return `http://localhost:5000${
    source.startsWith("/")
      ? ""
      : "/"
  }${source}`
}


function normalizeUser(user) {
  if (!user) {
    return null
  }

  return {
    ...user,

    firstName:
      user.firstName || "",

    lastName:
      user.lastName || "",

    email:
      user.email || "",

    phone:
      user.phone || "",

    address:
      user.address || "",

    profilePhoto:
      user.profilePhoto || "",

    role:
      user.role || "trainer",

    isActive:
      user.isActive !== false,

    createdAt:
      user.createdAt || null,
  }
}


function TrainerProfile() {
  const navigate =
    useNavigate()

  const {
    user: authUser,
    logout,
  } = useAuth()

  const {
    theme,
    toggleTheme,
  } = useTheme()

  const [
    user,
    setUser,
  ] = useState(() =>
    normalizeUser(
      authUser ||
        getStoredUser(),
    ),
  )

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    saved,
    setSaved,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState("")

  const [
    photoFile,
    setPhotoFile,
  ] = useState(null)

  const [
    photoPreview,
    setPhotoPreview,
  ] = useState(() =>
    getMediaUrl(
      authUser?.profilePhoto ||
        getStoredUser()?.profilePhoto ||
        "",
    ),
  )

  const [
    photoUploading,
    setPhotoUploading,
  ] = useState(false)

  const [
    editing,
    setEditing,
  ] = useState(false)

  const [
    showLogoutModal,
    setShowLogoutModal,
  ] = useState(false)


  /*
  |--------------------------------------------------------------------------
  | Load authenticated trainer
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true

    const loadTrainer =
      async () => {
        try {
          setLoading(true)
          setError("")

          const response =
            await getMe()

          const backendUser =
            response?.user

          if (
            !mounted ||
            !backendUser
          ) {
            return
          }

          const normalized =
            normalizeUser(
              backendUser,
            )

          setUser(normalized)

          localStorage.setItem(
            "user",
            JSON.stringify(
              backendUser,
            ),
          )

          setPhotoPreview(
            getMediaUrl(
              backendUser.profilePhoto ||
                "",
            ),
          )
        } catch (loadError) {
          console.error(
            "Unable to load trainer profile:",
            loadError,
          )

          if (mounted) {
            const cachedUser =
              normalizeUser(
                getStoredUser() ||
                  authUser,
              )

            if (cachedUser) {
              setUser(cachedUser)

              setPhotoPreview(
                getMediaUrl(
                  cachedUser.profilePhoto ||
                    "",
                ),
              )

              /*
               * We still allow the trainer to
               * view the profile using the cached
               * authenticated user.
               */
              setError("")
            } else {
              setError(
                loadError
                  ?.response
                  ?.data
                  ?.message ||
                  "Unable to load your trainer profile.",
              )
            }
          }
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      }

    loadTrainer()

    return () => {
      mounted = false
    }
  }, [])


  /*
  |--------------------------------------------------------------------------
  | Keep local trainer state synchronized
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!authUser) {
      return
    }

    const normalized =
      normalizeUser(authUser)

    setUser(
      (current) => ({
        ...current,
        ...normalized,
      }),
    )

    if (
      normalized.profilePhoto
    ) {
      setPhotoPreview(
        getMediaUrl(
          normalized.profilePhoto,
        ),
      )
    }
  }, [authUser])


  const fullName =
    useMemo(
      () =>
        getFullName(user),
      [user],
    )


  const initials =
    useMemo(
      () =>
        getInitials(user),
      [user],
    )


  const gymName =
    useMemo(
      () =>
        getGymName(user),
      [user],
    )


  const gymLocation =
    useMemo(
      () =>
        getGymLocation(user),
      [user],
    )


  const joinedDate =
    useMemo(
      () =>
        formatDate(
          user?.createdAt,
        ),
      [user?.createdAt],
    )


  const updateField = (
    field,
    value,
  ) => {
    setUser(
      (current) => ({
        ...current,
        [field]: value,
      }),
    )

    setSaved(false)
    setError("")
  }


  /*
  |--------------------------------------------------------------------------
  | Photo selection
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

    setSaved(false)
    setError("")
  }


  const handlePhotoCancel =
    () => {
      setPhotoFile(null)

      setPhotoPreview(
        getMediaUrl(
          user?.profilePhoto ||
            "",
        ),
      )

      const input =
        document.getElementById(
          "trainer-profile-photo-input",
        )

      if (input) {
        input.value = ""
      }
    }


  /*
  |--------------------------------------------------------------------------
  | Upload trainer photo
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
        setPhotoUploading(
          true,
        )

        setError("")
        setSaved(false)

        const response =
          await uploadProfilePhoto(
            photoFile,
          )

        if (
          response?.success ===
          false
        ) {
          throw new Error(
            response?.message ||
              "Unable to upload trainer profile photo.",
          )
        }

        const savedUser =
          response?.user

        const savedPhoto =
          response?.profilePhoto ||
          savedUser?.profilePhoto ||
          ""

        const updatedUser =
          normalizeUser(
            savedUser
              ? savedUser
              : {
                  ...user,
                  profilePhoto:
                    savedPhoto,
                },
          )

        setUser(
          updatedUser,
        )

        if (savedUser) {
          localStorage.setItem(
            "user",
            JSON.stringify(
              savedUser,
            ),
          )
        }

        setPhotoPreview(
          getMediaUrl(
            savedPhoto,
          ),
        )

        setPhotoFile(null)
        setSaved(true)

        const input =
          document.getElementById(
            "trainer-profile-photo-input",
          )

        if (input) {
          input.value = ""
        }

        window.setTimeout(
          () =>
            setSaved(false),
          3000,
        )
      } catch (photoError) {
        console.error(
          "Unable to upload trainer profile photo:",
          photoError,
        )

        setError(
          photoError
            ?.response
            ?.data
            ?.message ||
            photoError?.message ||
            "Unable to upload your profile photo.",
        )
      } finally {
        setPhotoUploading(
          false,
        )
      }
    }


  /*
  |--------------------------------------------------------------------------
  | Save trainer profile
  |--------------------------------------------------------------------------
  */

  const handleSave =
    async (event) => {
      event.preventDefault()

      if (saving) {
        return
      }

      setSaving(true)
      setSaved(false)
      setError("")

      try {
        const {
          firstName,
          lastName,
        } =
          splitFullName(
            fullName,
          )

        if (!firstName) {
          throw new Error(
            "Please enter your full name.",
          )
        }

        const payload = {
          firstName,
          lastName,

          phone:
            String(
              user?.phone || "",
            ).trim(),

          address:
            String(
              user?.address || "",
            ).trim(),
        }

        const response =
          await updateMyProfile(
            payload,
          )

        if (
          response?.success ===
          false
        ) {
          throw new Error(
            response?.message ||
              "Unable to update trainer profile.",
          )
        }

        const savedUser =
          response?.user

        const updatedUser =
          normalizeUser(
            savedUser || {
              ...user,
              firstName,
              lastName,
            },
          )

        setUser(
          updatedUser,
        )

        if (savedUser) {
          localStorage.setItem(
            "user",
            JSON.stringify(
              savedUser,
            ),
          )
        }

        setEditing(false)
        setSaved(true)

        window.setTimeout(
          () =>
            setSaved(false),
          3000,
        )
      } catch (saveError) {
        console.error(
          "Unable to save trainer profile:",
          saveError,
        )

        setError(
          saveError
            ?.response
            ?.data
            ?.message ||
            saveError?.message ||
            "Unable to save your trainer profile.",
        )
      } finally {
        setSaving(false)
      }
    }


  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const handleLogout =
    () => {
      setShowLogoutModal(
        true,
      )
    }


  const confirmLogout =
    () => {
      setShowLogoutModal(
        false,
      )

      logout()

      navigate(
        "/trainer-login",
        {
          replace: true,
        },
      )
    }


  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a0d] px-5 py-10 text-white">
        <div className="mx-auto w-full max-w-4xl">
          <div className="rounded-3xl border border-white/10 bg-[#0d1218] p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-400 text-black">
              <Dumbbell
                size={25}
              />
            </div>

            <p className="mt-5 text-sm font-bold text-gray-400">
              Loading trainer profile...
            </p>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-[#070a0d] pb-28 text-white">

      {/* ---------------------------------------------------------------- */}
      {/* PROFILE HEADER */}
      {/* ---------------------------------------------------------------- */}

      <header className="border-b border-white/10 bg-[#080c10]">

        <div className="mx-auto w-full max-w-5xl px-5 py-5 sm:px-7 lg:px-10">

          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-400 text-black">
                <Dumbbell
                  size={21}
                />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-400">
                  Trainer Workspace
                </p>

                <h1 className="text-lg font-black sm:text-xl">
                  Trainer Profile
                </h1>
              </div>

            </div>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/trainer",
                )
              }
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-black text-gray-300 transition hover:border-lime-400/30 hover:text-white"
            >
              BACK TO DASHBOARD
            </button>

          </div>

        </div>

      </header>


      <main className="mx-auto w-full max-w-5xl px-5 py-6 sm:px-7 lg:px-10">

        {/* ---------------------------------------------------------------- */}
        {/* ERROR */}
        {/* ---------------------------------------------------------------- */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">

            <ShieldCheck
              size={18}
              className="mt-0.5 shrink-0 text-red-400"
            />

            <p className="text-sm font-bold leading-6 text-red-400">
              {error}
            </p>

          </div>
        )}


        {/* ---------------------------------------------------------------- */}
        {/* HERO */}
        {/* ---------------------------------------------------------------- */}

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111820] via-[#0c1117] to-[#080b0f]">

          <div className="h-2 bg-lime-400" />

          <div className="p-6 sm:p-8">

            <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">

              <div className="flex items-center gap-5">

                <div className="relative shrink-0">

                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] border-2 border-lime-400/50 bg-[#050709] shadow-2xl sm:h-32 sm:w-32">

                    {photoPreview ? (
                      <img
                        src={
                          photoPreview
                        }
                        alt={
                          `${fullName} profile`
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-black text-lime-400">
                        {
                          initials
                        }
                      </span>
                    )}

                  </div>


                  <label
                    htmlFor="trainer-profile-photo-input"
                    className="absolute -bottom-2 -right-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border-4 border-[#0d1218] bg-lime-400 text-black shadow-lg transition hover:bg-lime-300"
                    title="Change profile photo"
                  >
                    <Camera
                      size={18}
                    />
                  </label>

                  <input
                    id="trainer-profile-photo-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={
                      handlePhotoSelect
                    }
                    className="hidden"
                  />

                </div>


                <div className="min-w-0">

                  <div className="flex flex-wrap items-center gap-2">

                    <span className="rounded-full bg-lime-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-lime-400">
                      GB Trainer
                    </span>

                    <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {user?.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>

                  </div>


                  <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                    {fullName}
                  </h2>


                  <p className="mt-1 text-sm font-bold text-gray-500">
                    Professional Trainer
                  </p>


                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">

                    <span className="flex items-center gap-1.5">
                      <BriefcaseBusiness
                        size={14}
                      />
                      {gymName}
                    </span>

                    {gymLocation && (
                      <span className="flex items-center gap-1.5">
                        <MapPin
                          size={14}
                        />
                        {gymLocation}
                      </span>
                    )}

                  </div>

                </div>

              </div>


              <div className="flex flex-wrap gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setEditing(
                      (current) =>
                        !current,
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black text-white transition hover:border-lime-400/30 hover:bg-lime-400/10"
                >
                  <Edit3
                    size={16}
                  />

                  {editing
                    ? "CANCEL EDIT"
                    : "EDIT PROFILE"}
                </button>

              </div>

            </div>


            {photoFile && (
              <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-lime-400/20 bg-lime-400/5 p-4 sm:flex-row sm:items-center">

                <div className="flex-1">
                  <p className="text-xs font-black text-lime-400">
                    NEW PROFILE PHOTO SELECTED
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Upload the selected photo to save it to your trainer account.
                  </p>
                </div>


                <div className="flex gap-2">

                  <button
                    type="button"
                    onClick={
                      handlePhotoUpload
                    }
                    disabled={
                      photoUploading
                    }
                    className="rounded-xl bg-lime-400 px-4 py-2.5 text-xs font-black text-black disabled:opacity-50"
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
                    className="rounded-xl border border-white/10 bg-black px-4 py-2.5 text-xs font-black text-gray-400"
                  >
                    CANCEL
                  </button>

                </div>

              </div>
            )}

          </div>

        </section>


        {/* ---------------------------------------------------------------- */}
        {/* TRAINER SNAPSHOT */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <TrainerStat
            icon={
              <Users
                size={20}
              />
            }
            label="Assigned Members"
            value="Manage"
            onClick={() =>
              navigate(
                "/trainer/members",
              )
            }
          />


          <TrainerStat
            icon={
              <Dumbbell
                size={20}
              />
            }
            label="Training Programs"
            value="Manage"
            onClick={() =>
              navigate(
                "/trainer/programs",
              )
            }
          />


          <TrainerStat
            icon={
              <Clock3
                size={20}
              />
            }
            label="Training Schedule"
            value="View"
            onClick={() =>
              navigate(
                "/trainer/schedule",
              )
            }
          />

        </section>


        {/* ---------------------------------------------------------------- */}
        {/* PROFESSIONAL IDENTITY */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-5 rounded-[2rem] border border-white/10 bg-[#0d1218]">

          <SectionHeader
            icon={
              <BriefcaseBusiness
                size={19}
              />
            }
            eyebrow="PROFESSIONAL IDENTITY"
            title="Trainer Information"
            description="Your professional account information for the gym."
          />


          <form
            onSubmit={
              handleSave
            }
            className="p-6 pt-0 sm:p-7 sm:pt-0"
          >

            <div className="grid gap-5 md:grid-cols-2">

              <ProfileField
                label="First Name"
                value={
                  user?.firstName
                }
                readOnly={
                  !editing
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "firstName",
                    value,
                  )
                }
              />


              <ProfileField
                label="Last Name"
                value={
                  user?.lastName
                }
                readOnly={
                  !editing
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "lastName",
                    value,
                  )
                }
              />


              <ProfileField
                label="Email Address"
                value={
                  user?.email
                }
                icon={
                  <Mail
                    size={15}
                  />
                }
                readOnly
              />


              <ProfileField
                label="Phone Number"
                value={
                  user?.phone
                }
                icon={
                  <Phone
                    size={15}
                  />
                }
                readOnly={
                  !editing
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "phone",
                    value,
                  )
                }
              />


              <ProfileField
                label="Gym"
                value={
                  gymName
                }
                icon={
                  <BriefcaseBusiness
                    size={15}
                  />
                }
                readOnly
              />


              <ProfileField
                label="Role"
                value="Trainer"
                icon={
                  <Award
                    size={15}
                  />
                }
                readOnly
              />

            </div>


            <div className="mt-5">

              <ProfileField
                label="Address"
                value={
                  user?.address
                }
                icon={
                  <MapPin
                    size={15}
                  />
                }
                readOnly={
                  !editing
                }
                onChange={(
                  value,
                ) =>
                  updateField(
                    "address",
                    value,
                  )
                }
                placeholder="Add your address"
              />

            </div>


            {editing && (
              <div className="mt-6 flex justify-end">

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="flex items-center justify-center gap-2 rounded-2xl bg-lime-400 px-6 py-3.5 text-xs font-black text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Save
                        size={16}
                      />
                      SAVING...
                    </>
                  ) : saved ? (
                    <>
                      <Check
                        size={16}
                      />
                      SAVED
                    </>
                  ) : (
                    <>
                      <Save
                        size={16}
                      />
                      SAVE CHANGES
                    </>
                  )}
                </button>

              </div>
            )}

          </form>

        </section>


        {/* ---------------------------------------------------------------- */}
        {/* ACCOUNT DETAILS */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-5 rounded-[2rem] border border-white/10 bg-[#0d1218]">

          <SectionHeader
            icon={
              <ShieldCheck
                size={19}
              />
            }
            eyebrow="ACCOUNT"
            title="Trainer Account"
            description="Your GB trainer access and account status."
          />


          <div className="grid gap-3 p-6 pt-0 sm:grid-cols-2 sm:p-7 sm:pt-0">

            <InfoCard
              label="Account Status"
              value={
                user?.isActive
                  ? "Active"
                  : "Inactive"
              }
              icon={
                <ShieldCheck
                  size={17}
                />
              }
              positive={
                user?.isActive
              }
            />


            <InfoCard
              label="Member Since"
              value={
                joinedDate
              }
              icon={
                <Clock3
                  size={17}
                />
              }
            />


            <InfoCard
              label="Account Role"
              value="Trainer"
              icon={
                <Award
                  size={17}
                />
              }
            />


            <InfoCard
              label="Gym Assignment"
              value={
                gymName
              }
              icon={
                <BriefcaseBusiness
                  size={17}
                />
              }
            />

          </div>

        </section>


        {/* ---------------------------------------------------------------- */}
        {/* TRAINER TOOLS */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-5 rounded-[2rem] border border-white/10 bg-[#0d1218]">

          <SectionHeader
            icon={
              <Dumbbell
                size={19}
              />
            }
            eyebrow="TRAINER TOOLS"
            title="Your Workspace"
            description="Quick access to the areas you use to manage training."
          />


          <div className="grid gap-3 p-6 pt-0 sm:grid-cols-2 lg:grid-cols-3 sm:p-7 sm:pt-0">

            <WorkspaceLink
              icon={
                <Users
                  size={19}
                />
              }
              title="Members"
              description="View and manage assigned members."
              onClick={() =>
                navigate(
                  "/trainer/members",
                )
              }
            />


            <WorkspaceLink
              icon={
                <Dumbbell
                  size={19}
                />
              }
              title="Exercises"
              description="Manage training exercises."
              onClick={() =>
                navigate(
                  "/trainer/exercises",
                )
              }
            />


            <WorkspaceLink
              icon={
                <BriefcaseBusiness
                  size={19}
                />
              }
              title="Programs"
              description="Build and manage workout programs."
              onClick={() =>
                navigate(
                  "/trainer/programs",
                )
              }
            />


            <WorkspaceLink
              icon={
                <Clock3
                  size={19}
                />
              }
              title="Schedule"
              description="Review your training schedule."
              onClick={() =>
                navigate(
                  "/trainer/schedule",
                )
              }
            />


            <WorkspaceLink
              icon={
                <Award
                  size={19}
                />
              }
              title="Progress"
              description="Track member training progress."
              onClick={() =>
                navigate(
                  "/trainer/progress",
                )
              }
            />


            <WorkspaceLink
              icon={
                <ChevronRight
                  size={19}
                />
              }
              title="Assignments"
              description="Manage member program assignments."
              onClick={() =>
                navigate(
                  "/trainer/assignments",
                )
              }
            />

          </div>

        </section>


        {/* ---------------------------------------------------------------- */}
        {/* APPEARANCE */}
        {/* ---------------------------------------------------------------- */}

        <section className="mt-5 rounded-[2rem] border border-white/10 bg-[#0d1218]">

          <SectionHeader
            icon={
              theme === "dark" ? (
                <Moon
                  size={19}
                />
              ) : (
                <Sun
                  size={19}
                />
              )
            }
            eyebrow="PREFERENCES"
            title="Appearance"
            description="Choose how the trainer workspace looks on your device."
          />


          <div className="p-6 pt-0 sm:p-7 sm:pt-0">

            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-sm font-black">
                  Workspace Theme
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Current theme:{" "}
                  <span className="font-bold text-gray-300">
                    {theme === "dark"
                      ? "Dark"
                      : "Light"}
                  </span>
                </p>

              </div>


              <div className="flex rounded-2xl border border-white/10 bg-black p-1">

                <button
                  type="button"
                  onClick={() => {
                    if (
                      theme !==
                      "light"
                    ) {
                      toggleTheme()
                    }
                  }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-black ${
                    theme ===
                    "light"
                      ? "bg-white text-black"
                      : "text-gray-500"
                  }`}
                >
                  <Sun
                    size={14}
                  />
                  LIGHT
                </button>


                <button
                  type="button"
                  onClick={() => {
                    if (
                      theme !==
                      "dark"
                    ) {
                      toggleTheme()
                    }
                  }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-black ${
                    theme ===
                    "dark"
                      ? "bg-lime-400 text-black"
                      : "text-gray-500"
                  }`}
                >
                  <Moon
                    size={14}
                  />
                  DARK
                </button>

              </div>

            </div>

          </div>

        </section>


        {/* ---------------------------------------------------------------- */}
        {/* LOGOUT */}
        {/* ---------------------------------------------------------------- */}

        <button
          type="button"
          onClick={
            handleLogout
          }
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-xs font-black text-red-400 transition hover:bg-red-500/10"
        >
          <LogOut
            size={17}
          />
          LOG OUT OF TRAINER ACCOUNT
        </button>

      </main>


      {/* ------------------------------------------------------------------ */}
      {/* LOGOUT MODAL */}
      {/* ------------------------------------------------------------------ */}

      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trainer-logout-title"
        >

          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#11161c] p-6 shadow-2xl">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
              <LogOut
                size={24}
              />
            </div>


            <h2
              id="trainer-logout-title"
              className="mt-5 text-xl font-black"
            >
              Log Out?
            </h2>


            <p className="mt-2 text-sm leading-6 text-gray-500">
              Are you sure you want to log out of your GB trainer account?
            </p>


            <div className="mt-6 grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={() =>
                  setShowLogoutModal(
                    false,
                  )
                }
                className="rounded-2xl border border-white/10 bg-black px-4 py-3.5 text-sm font-black text-gray-400 transition hover:text-white"
              >
                CANCEL
              </button>


              <button
                type="button"
                onClick={
                  confirmLogout
                }
                className="rounded-2xl bg-red-500 px-4 py-3.5 text-sm font-black text-white transition hover:bg-red-400"
              >
                LOG OUT
              </button>

            </div>

          </div>

        </div>
      )}


      {/* ------------------------------------------------------------------ */}
      {/* MOBILE TRAINER NAV */}
      {/* ------------------------------------------------------------------ */}

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-black/95 backdrop-blur-xl">

        <div className="mx-auto grid max-w-lg grid-cols-3 px-5 py-3">

          <MobileNavItem
            icon={
              <Dumbbell
                size={19}
              />
            }
            label="Home"
            onClick={() =>
              navigate(
                "/trainer",
              )
            }
          />


          <MobileNavItem
            icon={
              <Award
                size={19}
              />
            }
            label="Progress"
            onClick={() =>
              navigate(
                "/trainer/progress",
              )
            }
          />


          <MobileNavItem
            icon={
              <UserRound
                size={19}
              />
            }
            label="Profile"
            active
            onClick={() =>
              navigate(
                "/trainer/profile",
              )
            }
          />

        </div>

      </nav>

    </div>
  )
}


/* -------------------------------------------------------------------------- */
/* SECTION HEADER */
/* -------------------------------------------------------------------------- */

function SectionHeader({
  icon,
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="flex items-start gap-4 p-6 sm:p-7">

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lime-400/10 text-lime-400">
        {icon}
      </div>


      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-400">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-lg font-black">
          {title}
        </h2>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-gray-500">
          {description}
        </p>
      </div>

    </div>
  )
}


/* -------------------------------------------------------------------------- */
/* PROFILE FIELD */
/* -------------------------------------------------------------------------- */

function ProfileField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  icon,
  readOnly = false,
}) {
  return (
    <div>

      <label className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">

        {icon}

        {label}

      </label>


      <input
        type={type}
        value={
          value ?? ""
        }
        readOnly={
          readOnly
        }
        onChange={(
          event,
        ) =>
          onChange?.(
            event.target.value,
          )
        }
        placeholder={
          placeholder
        }
        className={`w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5 text-sm font-bold text-white outline-none placeholder:text-gray-700 ${
          readOnly
            ? "cursor-default opacity-70"
            : "focus:border-lime-400/50"
        }`}
      />

    </div>
  )
}


/* -------------------------------------------------------------------------- */
/* TRAINER STAT */
/* -------------------------------------------------------------------------- */

function TrainerStat({
  icon,
  label,
  value,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="group rounded-3xl border border-white/10 bg-[#0d1218] p-5 text-left transition hover:border-lime-400/30 hover:bg-[#10171e]"
    >

      <div className="flex items-center justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/10 text-lime-400">
          {icon}
        </div>

        <ChevronRight
          size={17}
          className="text-gray-700 transition group-hover:text-lime-400"
        />

      </div>


      <p className="mt-5 text-[10px] font-black uppercase tracking-wider text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">
        {value}
      </p>

    </button>
  )
}


/* -------------------------------------------------------------------------- */
/* INFO CARD */
/* -------------------------------------------------------------------------- */

function InfoCard({
  label,
  value,
  icon,
  positive = false,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">

      <div className="flex items-center gap-2 text-gray-500">
        {icon}

        <span className="text-[10px] font-black uppercase tracking-wider">
          {label}
        </span>
      </div>


      <p
        className={`mt-3 text-sm font-black ${
          positive
            ? "text-emerald-400"
            : "text-white"
        }`}
      >
        {value}
      </p>

    </div>
  )
}


/* -------------------------------------------------------------------------- */
/* WORKSPACE LINK */
/* -------------------------------------------------------------------------- */

function WorkspaceLink({
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-left transition hover:border-lime-400/30 hover:bg-lime-400/5"
    >

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-400/10 text-lime-400">
        {icon}
      </div>


      <div className="min-w-0 flex-1">

        <p className="text-sm font-black text-white">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-gray-600">
          {description}
        </p>

      </div>


      <ChevronRight
        size={17}
        className="shrink-0 text-gray-700 transition group-hover:text-lime-400"
      />

    </button>
  )
}


/* -------------------------------------------------------------------------- */
/* MOBILE NAV */
/* -------------------------------------------------------------------------- */

function MobileNavItem({
  icon,
  label,
  active = false,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`flex flex-col items-center gap-1 ${
        active
          ? "text-lime-400"
          : "text-gray-600"
      }`}
    >

      {icon}

      <span className="text-[10px] font-bold">
        {label}
      </span>

    </button>
  )
}


export default TrainerProfile