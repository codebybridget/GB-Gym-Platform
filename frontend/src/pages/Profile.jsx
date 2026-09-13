import {
  AlertTriangle,
  Camera,
  Check,
  ChevronDown,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldAlert,
  Sun,
  Moon,
  UserRound,
} from "lucide-react"

import {
  useEffect,
  useState,
} from "react"

import {
  useNavigate,
} from "react-router-dom"

import {
  useAuth,
} from "../context/AuthContext.jsx"

import {
  useTheme,
} from "../context/ThemeContext.jsx"

import {
  useGym,
} from "../context/GymContext.jsx"

import {
  getProfile,
  saveProfile,
} from "../utils/profileStorage"

import {
  buildMediaUrl,
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
} from "../api/api.js"


const goals = [
  {
    value: "lose_weight",
    label: "Lose Weight",
    description:
      "Reduce body weight and improve body composition.",
  },

  {
    value: "keep_fit",
    label: "Keep Fit",
    description:
      "Maintain fitness, strength and overall health.",
  },

  {
    value: "gain_weight",
    label: "Gain Weight",
    description:
      "Build body mass, strength and muscle.",
  },

  {
    value: "become_trainer",
    label: "Train to Become a Trainer",
    description:
      "Develop the knowledge and fitness required to become a trainer.",
  },
]


function resolveProfilePhoto(
  photo,
) {
  if (!photo) {
    return ""
  }

  const value =
    String(photo).trim()

  if (!value) {
    return ""
  }

  if (
    value.startsWith(
      "http://",
    ) ||
    value.startsWith(
      "https://",
    ) ||
    value.startsWith(
      "data:",
    ) ||
    value.startsWith(
      "blob:",
    )
  ) {
    return value
  }

  try {
    return buildMediaUrl(
      value,
    )
  } catch (error) {
    console.error(
      "Unable to build profile photo URL:",
      error,
    )

    return value
  }
}


function parseMeasurement(
  value,
  fallbackUnit,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return {
      value: null,
      unit: fallbackUnit,
    }
  }

  if (
    typeof value === "object"
  ) {
    return {
      value:
        value.value === null ||
        value.value === undefined ||
        value.value === ""
          ? null
          : Number(value.value),
      unit:
        value.unit ||
        fallbackUnit,
    }
  }

  const text =
    String(value).trim()

  if (!text) {
    return {
      value: null,
      unit: fallbackUnit,
    }
  }

  const match =
    text.match(
      /^([\d.]+)\s*(cm|ft|kg|lb)?$/i,
    )

  if (!match) {
    return {
      value: null,
      unit: fallbackUnit,
    }
  }

  return {
    value: Number(
      match[1],
    ),
    unit:
      match[2]
        ? match[2].toLowerCase()
        : fallbackUnit,
  }
}


function formatMeasurement(
  measurement,
  fallbackUnit,
) {
  if (
    !measurement ||
    measurement.value === null ||
    measurement.value === undefined ||
    measurement.value === ""
  ) {
    return ""
  }

  return `${measurement.value} ${
    measurement.unit ||
    fallbackUnit
  }`
}


function splitFullName(
  fullName,
) {
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

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: "",
    }
  }

  return {
    firstName: parts[0],
    lastName:
      parts.slice(1).join(" "),
  }
}


function backendUserToProfile(
  user,
  currentProfile,
) {
  const firstName =
    user?.firstName ||
    currentProfile?.fullName
      ?.split(" ")[0] ||
    ""

  const lastName =
    user?.lastName ||
    ""

  const fullName =
    `${firstName} ${lastName}`
      .trim()

  const height =
    formatMeasurement(
      user?.height,
      "cm",
    )

  const weight =
    formatMeasurement(
      user?.weight,
      "kg",
    )

  const emergency =
    Array.isArray(
      user?.emergencyContacts,
    ) &&
    user.emergencyContacts.length
      ? user.emergencyContacts[0]
      : currentProfile?.emergencyContact ||
        {
          name: "",
          relationship: "",
          phone: "",
        }

  const medical =
    user?.medicalProfile

  return {
    ...(currentProfile || {}),

    fullName:
      fullName ||
      currentProfile?.fullName ||
      "Member",

    email:
      user?.email ||
      currentProfile?.email ||
      "",

    phone:
      user?.phone ||
      currentProfile?.phone ||
      "",

    age:
      user?.age !== null &&
      user?.age !== undefined
        ? String(user.age)
        : currentProfile?.age ||
          "",

    height,

    weight,

    address:
      user?.address ||
      currentProfile?.address ||
      "",

    goal:
      user?.fitnessGoal ||
      currentProfile?.goal ||
      "keep_fit",

    medicalInfo:
      medical?.additionalInformation ||
      currentProfile?.medicalInfo ||
      "",

    emergencyContact: {
      name:
        emergency?.name ||
        "",

      relationship:
        emergency?.relationship ||
        "",

      phone:
        emergency?.phone ||
        "",
    },

    profilePhoto:
      user?.profilePhoto ||
      currentProfile?.profilePhoto ||
      "",

    joinedDate:
      currentProfile?.joinedDate ||
      (
        user?.createdAt
          ? new Date(
              user.createdAt,
            )
              .toISOString()
              .split("T")[0]
          : ""
      ),
  }
}


function Profile() {
  const navigate =
    useNavigate()

  const {
    logout,
  } = useAuth()

  const {
    theme,
    toggleTheme,
  } = useTheme()

  const {
    gym,
  } = useGym() || {}

  const gymName =
    gym?.name?.trim() ||
    "Gym"

  const gymMemberLabel =
    `${gymName} Member`

  const [
    profile,
    setProfile,
  ] = useState(() =>
    getProfile(),
  )

  const [
    saved,
    setSaved,
  ] = useState(false)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState("")

  const [
    showGoalOptions,
    setShowGoalOptions,
  ] = useState(false)

  const [
    photoFile,
    setPhotoFile,
  ] = useState(null)

  const [
    photoPreview,
    setPhotoPreview,
  ] = useState(() =>
    resolveProfilePhoto(
      getProfile()
        ?.profilePhoto,
    ),
  )

  const [
    photoUploading,
    setPhotoUploading,
  ] = useState(false)

  const [
    showLogoutModal,
    setShowLogoutModal,
  ] = useState(false)


  /*
  |--------------------------------------------------------------------------
  | Load profile from MongoDB
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true

    const loadProfile =
      async () => {
        try {
          setLoading(true)
          setError("")

          const response =
            await getMyProfile()

          const user =
            response?.user

          if (
            !mounted ||
            !user
          ) {
            return
          }

          const existingProfile =
            getProfile()

          const backendProfile =
            backendUserToProfile(
              user,
              existingProfile,
            )

          /*
          |--------------------------------------------------------------------------
          | IMPORTANT:
          | Use the photo returned by MongoDB as the current photo.
          |--------------------------------------------------------------------------
          */

          const serverPhoto =
            user?.profilePhoto ||
            backendProfile?.profilePhoto ||
            ""

          const resolvedPhoto =
            resolveProfilePhoto(
              serverPhoto,
            )

          setProfile(
            backendProfile,
          )

          /*
          |--------------------------------------------------------------------------
          | Keep both local profile storage and the visible preview
          | synchronized with the backend.
          |--------------------------------------------------------------------------
          */

          saveProfile(
            backendProfile,
          )

          setPhotoPreview(
            resolvedPhoto,
          )
        } catch (loadError) {
          console.error(
            "Unable to load profile:",
            loadError,
          )

          if (mounted) {
            setError(
              loadError
                ?.response
                ?.data
                ?.message ||
                "Unable to load your profile from the server.",
            )
          }
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      }

    loadProfile()

    return () => {
      mounted = false
    }
  }, [])


  const updateField = (
    field,
    value,
  ) => {
    setProfile(
      (current) => ({
        ...current,
        [field]: value,
      }),
    )

    setSaved(false)
    setError("")
  }


  const updateEmergencyContact = (
    field,
    value,
  ) => {
    setProfile(
      (current) => ({
        ...current,

        emergencyContact: {
          ...current.emergencyContact,
          [field]: value,
        },
      }),
    )

    setSaved(false)
    setError("")
  }


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

    setPhotoFile(
      file,
    )

    setPhotoPreview(
      URL.createObjectURL(
        file,
      ),
    )

    setSaved(false)
    setError("")
  }


  const handlePhotoCancel = () => {
    setPhotoFile(null)

    setPhotoPreview(
      resolveProfilePhoto(
        profile.profilePhoto ||
          "",
      ),
    )

    const input =
      document.getElementById(
        "profile-photo-input",
      )

    if (input) {
      input.value = ""
    }
  }


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
              "Unable to upload profile photo.",
          )
        }

        const savedUser =
          response?.user

        const savedPhoto =
          response?.profilePhoto ||
          savedUser?.profilePhoto ||
          ""

        if (!savedPhoto) {
          throw new Error(
            "The photo upload completed, but the server did not return the saved profile photo.",
          )
        }

        const updatedProfile =
          savedUser
            ? backendUserToProfile(
                savedUser,
                profile,
              )
            : {
                ...profile,
                profilePhoto:
                  savedPhoto,
              }

        /*
        |--------------------------------------------------------------------------
        | Force the saved photo into the profile object.
        |--------------------------------------------------------------------------
        */

        updatedProfile.profilePhoto =
          savedPhoto

        /*
        |--------------------------------------------------------------------------
        | Save the server value locally.
        |--------------------------------------------------------------------------
        */

        saveProfile(
          updatedProfile,
        )

        setProfile(
          updatedProfile,
        )

        /*
        |--------------------------------------------------------------------------
        | IMPORTANT:
        | Resolve the backend path before displaying it.
        |--------------------------------------------------------------------------
        */

        setPhotoPreview(
          resolveProfilePhoto(
            savedPhoto,
          ),
        )

        setPhotoFile(
          null,
        )

        setSaved(true)

        const input =
          document.getElementById(
            "profile-photo-input",
          )

        if (input) {
          input.value = ""
        }

        setTimeout(() => {
          setSaved(false)
        }, 3000)
      } catch (photoError) {
        console.error(
          "Unable to upload profile photo:",
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
  | Save profile to MongoDB
  |--------------------------------------------------------------------------
  */

  const handleSave = async (
    event,
  ) => {
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
          profile.fullName,
        )

      if (!firstName) {
        throw new Error(
          "Please enter your full name.",
        )
      }

      const age =
        profile.age === "" ||
        profile.age === null ||
        profile.age === undefined
          ? null
          : Number(
              profile.age,
            )

      if (
        age !== null &&
        (!Number.isFinite(age) ||
          age < 1 ||
          age > 120)
      ) {
        throw new Error(
          "Age must be between 1 and 120.",
        )
      }

      const height =
        parseMeasurement(
          profile.height,
          "cm",
        )

      const weight =
        parseMeasurement(
          profile.weight,
          "kg",
        )

      const emergencyContact =
        profile.emergencyContact || {
          name: "",
          relationship: "",
          phone: "",
        }

      const existingProfile =
        getProfile()

      const existingMedical =
        existingProfile?.medicalProfile ||
        {}

      const medicalText =
        String(
          profile.medicalInfo ||
            "",
        ).trim()

      const payload = {
        firstName,

        ...(lastName
          ? {
              lastName,
            }
          : {}),

        phone:
          String(
            profile.phone || "",
          ).trim(),

        age,

        height: {
          value:
            height.value,

          unit:
            ["cm", "ft"].includes(
              height.unit,
            )
              ? height.unit
              : "cm",
        },

        weight: {
          value:
            weight.value,

          unit:
            ["kg", "lb"].includes(
              weight.unit,
            )
              ? weight.unit
              : "kg",
        },

        address:
          String(
            profile.address ||
              "",
          ).trim(),

        fitnessGoal:
          profile.goal ||
          "keep_fit",

        medicalProfile: {
          hasMedicalCondition:
            Boolean(
              medicalText ||
                existingMedical.conditions ||
                existingMedical.medications ||
                existingMedical.allergies ||
                existingMedical.injuries,
            ),

          conditions:
            existingMedical.conditions ||
            "",

          medications:
            existingMedical.medications ||
            "",

          allergies:
            existingMedical.allergies ||
            "",

          injuries:
            existingMedical.injuries ||
            "",

          additionalInformation:
            medicalText,
        },

        emergencyContacts: [
          {
            name:
              String(
                emergencyContact.name ||
                  "",
              ).trim(),

            relationship:
              String(
                emergencyContact.relationship ||
                  "",
              ).trim(),

            phone:
              String(
                emergencyContact.phone ||
                  "",
              ).trim(),

            email:
              String(
                emergencyContact.email ||
                  "",
              )
                .trim()
                .toLowerCase(),
          },
        ],
      }


      const response =
        await updateMyProfile(
          payload,
        )

      if (
        !response?.success
      ) {
        throw new Error(
          response?.message ||
            "Unable to update profile.",
        )
      }


      const savedUser =
        response?.user

      const updatedProfile =
        savedUser
          ? backendUserToProfile(
              savedUser,
              profile,
            )
          : {
              ...profile,

              age:
                age === null
                  ? ""
                  : String(age),

              height:
                formatMeasurement(
                  height,
                  "cm",
                ),

              weight:
                formatMeasurement(
                  weight,
                  "kg",
                ),
            }


      /*
      |--------------------------------------------------------------------------
      | NEVER lose the existing profile photo when saving normal
      | profile information.
      |--------------------------------------------------------------------------
      */

      const returnedPhoto =
        savedUser?.profilePhoto ||
        response?.profilePhoto ||
        profile.profilePhoto ||
        ""

      updatedProfile.profilePhoto =
        returnedPhoto


      saveProfile(
        updatedProfile,
      )

      setProfile(
        updatedProfile,
      )

      /*
      |--------------------------------------------------------------------------
      | Keep the visible photo synchronized after saving the profile.
      |--------------------------------------------------------------------------
      */

      if (returnedPhoto) {
        setPhotoPreview(
          resolveProfilePhoto(
            returnedPhoto,
          ),
        )
      }

      setSaved(true)

      setTimeout(() => {
        setSaved(false)
      }, 3000)
    } catch (saveError) {
      console.error(
        "Unable to save profile:",
        saveError,
      )

      setError(
        saveError
          ?.response
          ?.data
          ?.message ||
          saveError?.message ||
          "Unable to save your profile.",
      )
    } finally {
      setSaving(false)
    }
  }


  const handleLogout = () => {
    setShowLogoutModal(
      true,
    )
  }


  const confirmLogout = () => {
    setShowLogoutModal(
      false,
    )

    logout()

    navigate(
      "/login",
      {
        replace: true,
      },
    )
  }


  const selectedGoal =
    goals.find(
      (goal) =>
        goal.value ===
        profile.goal,
    )


  return (
    <div className="min-h-screen bg-black pb-28 text-white">

      <header className="border-b border-white/10">

        <div className="mx-auto flex max-w-md items-center gap-4 px-5 py-4">

          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border-2 border-lime-400/40 bg-yellow-400 text-black">

            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Profile"
                className="h-full w-full object-cover"
                onError={(
                  event,
                ) => {
                  console.error(
                    "Profile photo failed to load:",
                    photoPreview,
                  )

                  event.currentTarget.style.display =
                    "none"
                }}
              />
            ) : (
              <UserRound
                size={21}
              />
            )}

          </div>


          <div>

            <p className="text-[10px] font-black uppercase tracking-widest text-lime-400">
              {gymMemberLabel}
            </p>

            <h1 className="text-xl font-black">
              My Profile
            </h1>

          </div>

        </div>

      </header>


      <main className="mx-auto w-full max-w-md px-5 py-6">

        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-400">
            {error}
          </div>
        )}


        {/* PROFILE PHOTO */}

        {!loading && (
          <section className="mb-5 rounded-3xl border border-white/10 bg-white/5 p-5">

            <div className="flex items-center gap-4">

              <div className="relative shrink-0">

                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-lime-400/40 bg-black">

                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile"
                      className="h-full w-full object-cover"
                      onError={(
                        event,
                      ) => {
                        console.error(
                          "Profile photo failed to load:",
                          photoPreview,
                        )

                        event.currentTarget.style.display =
                          "none"
                      }}
                    />
                  ) : (
                    <UserRound
                      size={38}
                      className="text-gray-600"
                    />
                  )}

                </div>


                <label
                  htmlFor="profile-photo-input"
                  className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-lime-400 text-black shadow-lg"
                >
                  <Camera
                    size={17}
                  />
                </label>


                <input
                  id="profile-photo-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={
                    handlePhotoSelect
                  }
                  className="hidden"
                />

              </div>


              <div className="min-w-0 flex-1">

                <p className="text-xs font-black uppercase tracking-wider text-lime-400">
                  Profile Photo
                </p>

                <h2 className="mt-1 text-lg font-black">
                  Your Profile Picture
                </h2>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Add a photo so your {gymName} profile feels more personal.
                </p>

              </div>

            </div>


            {photoFile && (
              <div className="mt-4 flex gap-3">

                <button
                  type="button"
                  onClick={
                    handlePhotoUpload
                  }
                  disabled={
                    photoUploading
                  }
                  className="flex-1 rounded-2xl bg-lime-400 px-4 py-3 text-xs font-black text-black disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-xs font-black text-gray-400 disabled:opacity-60"
                >
                  CANCEL
                </button>

              </div>
            )}

          </section>
        )}


        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">

            <p className="text-sm font-bold text-gray-400">
              Loading your profile...
            </p>

          </div>
        ) : (

          <form
            onSubmit={
              handleSave
            }
          >

            {/* APPEARANCE */}

            <section className="mt-5 rounded-3xl border border-lime-400/20 bg-white/5 p-5">

              <div className="flex items-center justify-between gap-4">

                <div>

                  <p className="text-xs font-black uppercase tracking-wider text-lime-400">
                    Appearance
                  </p>

                  <h2 className="mt-1 text-lg font-black">
                    Light / Dark Mode
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Choose how {gymName} looks on your device.
                  </p>

                </div>


                <div className="flex shrink-0 rounded-2xl border border-white/10 bg-black p-1">

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
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black transition ${
                      theme ===
                      "light"
                        ? "bg-white text-black"
                        : "text-gray-500 hover:text-white"
                    }`}
                    aria-label="Use light mode"
                    aria-pressed={
                      theme ===
                      "light"
                    }
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
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black transition ${
                      theme ===
                      "dark"
                        ? "bg-lime-400 text-black"
                        : "text-gray-500 hover:text-white"
                    }`}
                    aria-label="Use dark mode"
                    aria-pressed={
                      theme ===
                      "dark"
                    }
                  >
                    <Moon
                      size={14}
                    />
                    DARK
                  </button>

                </div>

              </div>

            </section>


            {/* PERSONAL INFORMATION */}

            <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">

              <div>

                <p className="text-xs font-black uppercase tracking-wider text-gray-600">
                  Personal Information
                </p>

                <h2 className="mt-1 text-lg font-black">
                  About You
                </h2>

              </div>


              <div className="mt-5 space-y-4">

                <ProfileField
                  label="Full Name"
                  value={
                    profile.fullName
                  }
                  onChange={(
                    value,
                  ) =>
                    updateField(
                      "fullName",
                      value,
                    )
                  }
                  icon={
                    <UserRound
                      size={15}
                    />
                  }
                />


                <div className="grid grid-cols-2 gap-3">

                  <ProfileField
                    label="Age"
                    value={
                      profile.age
                    }
                    type="number"
                    onChange={(
                      value,
                    ) =>
                      updateField(
                        "age",
                        value,
                      )
                    }
                  />


                  <ProfileField
                    label="Height"
                    value={
                      profile.height
                    }
                    onChange={(
                      value,
                    ) =>
                      updateField(
                        "height",
                        value,
                      )
                    }
                    placeholder="e.g. 175 cm"
                  />

                </div>


                <ProfileField
                  label="Weight"
                  value={
                    profile.weight
                  }
                  onChange={(
                    value,
                  ) =>
                    updateField(
                      "weight",
                      value,
                    )
                  }
                  placeholder="e.g. 70 kg"
                />

              </div>

            </section>


            {/* CONTACT INFORMATION */}

            <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">

              <div>

                <p className="text-xs font-black uppercase tracking-wider text-gray-600">
                  Contact Information
                </p>

                <h2 className="mt-1 text-lg font-black">
                  How We Can Reach You
                </h2>

              </div>


              <div className="mt-5 space-y-4">

                <ProfileField
                  label="Phone Number"
                  value={
                    profile.phone
                  }
                  onChange={(
                    value,
                  ) =>
                    updateField(
                      "phone",
                      value,
                    )
                  }
                  icon={
                    <Phone
                      size={15}
                    />
                  }
                />


                <ProfileField
                  label="Email Address"
                  value={
                    profile.email
                  }
                  type="email"
                  readOnly
                  icon={
                    <Mail
                      size={15}
                    />
                  }
                />


                <ProfileField
                  label="Home Address"
                  value={
                    profile.address
                  }
                  onChange={(
                    value,
                  ) =>
                    updateField(
                      "address",
                      value,
                    )
                  }
                  icon={
                    <MapPin
                      size={15}
                    />
                  }
                  placeholder="Enter your home address"
                />

              </div>

            </section>


            {/* FITNESS GOAL */}

            <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">

              <div>

                <p className="text-xs font-black uppercase tracking-wider text-gray-600">
                  Fitness Goal
                </p>

                <h2 className="mt-1 text-lg font-black">
                  What Are You Training For?
                </h2>

              </div>


              <div className="relative mt-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowGoalOptions(
                      (current) =>
                        !current,
                    )
                  }
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black p-4 text-left"
                >

                  <div>

                    <p className="text-sm font-black">
                      {
                        selectedGoal?.label ||
                        "Select your goal"
                      }
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-600">
                      {
                        selectedGoal?.description ||
                        "Choose your main fitness goal."
                      }
                    </p>

                  </div>


                  <ChevronDown
                    size={17}
                    className="shrink-0 text-gray-600"
                  />

                </button>


                {showGoalOptions && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#111] shadow-2xl">

                    {goals.map(
                      (goal) => (
                        <button
                          key={
                            goal.value
                          }
                          type="button"
                          onClick={() => {
                            updateField(
                              "goal",
                              goal.value,
                            )

                            setShowGoalOptions(
                              false,
                            )
                          }}
                          className={`w-full border-b border-white/5 p-4 text-left last:border-0 ${
                            profile.goal ===
                            goal.value
                              ? "bg-lime-400/10"
                              : ""
                          }`}
                        >

                          <div className="flex items-center justify-between">

                            <p className="text-sm font-black">
                              {
                                goal.label
                              }
                            </p>


                            {profile.goal ===
                              goal.value && (
                              <Check
                                size={
                                  16
                                }
                                className="text-lime-400"
                              />
                            )}

                          </div>


                          <p className="mt-1 text-xs leading-5 text-gray-600">
                            {
                              goal.description
                            }
                          </p>

                        </button>
                      ),
                    )}

                  </div>
                )}

              </div>

            </section>


            {/* MEDICAL INFORMATION */}

            <section className="mt-5 rounded-3xl border border-red-500/20 bg-red-500/5 p-5">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                  <AlertTriangle
                    size={18}
                  />
                </div>


                <div>

                  <p className="text-xs font-black uppercase tracking-wider text-red-400">
                    Medical Information
                  </p>

                  <h2 className="mt-1 text-lg font-black">
                    Health & Safety
                  </h2>

                  <p className="mt-2 text-xs leading-5 text-gray-600">
                    Please tell your trainer about any medical diagnosis, injury, physical limitation, medication consideration or other health information that may affect your training.
                  </p>

                </div>

              </div>


              <textarea
                rows={5}
                value={
                  profile.medicalInfo
                }
                onChange={(
                  event,
                ) =>
                  updateField(
                    "medicalInfo",
                    event.target.value,
                  )
                }
                placeholder="Enter any medical diagnosis or health information..."
                className="mt-5 w-full resize-none rounded-2xl border border-red-500/20 bg-black px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-gray-700 focus:border-red-400"
              />

            </section>


            {/* EMERGENCY CONTACT */}

            <section className="mt-5 rounded-3xl border border-yellow-400/20 bg-yellow-400/5 p-5">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-black">
                  <ShieldAlert
                    size={18}
                  />
                </div>


                <div>

                  <p className="text-xs font-black uppercase tracking-wider text-yellow-500">
                    Emergency Contact
                  </p>

                  <h2 className="mt-1 text-lg font-black">
                    Who Should We Contact?
                  </h2>

                  <p className="mt-2 text-xs leading-5 text-gray-600">
                    Add someone we can contact in case of an emergency during your time at {gymName}.
                  </p>

                </div>

              </div>


              <div className="mt-5 space-y-4">

                <ProfileField
                  label="Emergency Contact Name"
                  value={
                    profile
                      .emergencyContact
                      ?.name || ""
                  }
                  onChange={(
                    value,
                  ) =>
                    updateEmergencyContact(
                      "name",
                      value,
                    )
                  }
                  placeholder="Full name"
                />


                <div className="grid grid-cols-2 gap-3">

                  <ProfileField
                    label="Relationship"
                    value={
                      profile
                        .emergencyContact
                        ?.relationship ||
                      ""
                    }
                    onChange={(
                      value,
                    ) =>
                      updateEmergencyContact(
                        "relationship",
                        value,
                      )
                    }
                    placeholder="Mother"
                  />


                  <ProfileField
                    label="Phone Number"
                    value={
                      profile
                        .emergencyContact
                        ?.phone ||
                      ""
                    }
                    onChange={(
                      value,
                    ) =>
                      updateEmergencyContact(
                        "phone",
                        value,
                      )
                    }
                    placeholder="080..."
                  />

                </div>

              </div>

            </section>


            {/* SAVE */}

            <button
              type="submit"
              disabled={saving}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-400 px-5 py-4 text-sm font-black text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {saving ? (
                <>
                  <Save
                    size={18}
                  />
                  SAVING...
                </>
              ) : saved ? (
                <>
                  <Check
                    size={18}
                  />
                  PROFILE SAVED
                </>
              ) : (
                <>
                  <Save
                    size={18}
                  />
                  SAVE PROFILE
                </>
              )}

            </button>

          </form>
        )}


        {/* LOGOUT */}

        <button
          type="button"
          onClick={
            handleLogout
          }
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-black text-red-400 transition hover:bg-red-500/20"
        >
          <LogOut
            size={18}
          />
          LOG OUT
        </button>

      </main>


      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
        >

          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#111] p-6 shadow-2xl">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
              <LogOut
                size={24}
              />
            </div>

            <h2
              id="logout-dialog-title"
              className="mt-5 text-xl font-black text-white"
            >
              Log Out?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Are you sure you want to log out of your {gymName} account?
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={() =>
                  setShowLogoutModal(
                    false,
                  )
                }
                className="rounded-2xl border border-white/10 bg-black px-4 py-3.5 text-sm font-black text-gray-400 transition hover:border-white/20 hover:text-white"
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


      <BottomNavigation />

    </div>
  )
}


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

      <label className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-gray-500">
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
        min={
          type === "number"
            ? 1
            : undefined
        }
        className={`w-full rounded-2xl border border-white/10 bg-black px-4 py-3.5 text-sm font-bold text-white outline-none placeholder:text-gray-700 focus:border-lime-400 ${
          readOnly
            ? "cursor-not-allowed opacity-60"
            : ""
        }`}
      />

    </div>
  )
}


function BottomNavigation() {
  const navigate =
    useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-black/95 backdrop-blur-xl">

      <div className="mx-auto grid max-w-md grid-cols-3 px-5 py-3">

        <button
          type="button"
          onClick={() =>
            navigate("/")
          }
          className="flex flex-col items-center gap-1 text-gray-600"
        >
          <UserRound
            size={19}
          />

          <span className="text-[10px] font-bold">
            Home
          </span>
        </button>


        <button
          type="button"
          onClick={() =>
            navigate(
              "/progress",
            )
          }
          className="flex flex-col items-center gap-1 text-gray-600"
        >
          <ShieldAlert
            size={19}
          />

          <span className="text-[10px] font-bold">
            Progress
          </span>
        </button>


        <button
          type="button"
          onClick={() =>
            navigate(
              "/profile",
            )
          }
          className="flex flex-col items-center gap-1 text-yellow-400"
        >
          <UserRound
            size={19}
          />

          <span className="text-[10px] font-bold">
            Profile
          </span>
        </button>

      </div>

    </nav>
  )
}


export default Profile