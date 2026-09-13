import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Mail,
  Phone,
  Search,
  ShieldAlert,
  Users,
  X,
} from "lucide-react"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  getMembers,
  updateMemberStatus,
} from "../../api/api.js"

import {
  useGym,
} from "../../context/GymContext.jsx"

const goals = {
  lose_weight: "Lose Weight",
  keep_fit: "Keep Fit",
  gain_weight: "Gain Weight",
  become_trainer:
    "Train to Become a Trainer",
}

function Members() {
  const { gym } =
    useGym() || {}

  const gymName =
    gym?.name?.trim() ||
    "Gym"

  const [members, setMembers] =
    useState([])

  const [search, setSearch] =
    useState("")

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [selectedMember, setSelectedMember] =
    useState(null)

  const [updatingStatus, setUpdatingStatus] =
    useState(false)

  /*
  |--------------------------------------------------------------------------
  | Load members from MongoDB
  |--------------------------------------------------------------------------
  */

  const loadMembers = async () => {
    try {
      setLoading(true)
      setError("")

      const response =
        await getMembers()

      setMembers(
        response?.members || [],
      )
    } catch (error) {
      console.error(
        "Load members error:",
        error,
      )

      setError(
        error?.response?.data
          ?.message ||
          "Unable to load members.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const filteredMembers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      if (!query) {
        return members
      }

      return members.filter(
        (member) => {
          const fullName =
            `${member.firstName || ""} ${
              member.lastName || ""
            }`
              .trim()
              .toLowerCase()

          return (
            fullName.includes(query) ||
            (member.email || "")
              .toLowerCase()
              .includes(query) ||
            (member.phone || "")
              .toLowerCase()
              .includes(query)
          )
        },
      )
    }, [members, search])

  /*
  |--------------------------------------------------------------------------
  | Member status
  |--------------------------------------------------------------------------
  */

  const handleToggleStatus =
    async (member) => {
      try {
        setUpdatingStatus(true)

        const response =
          await updateMemberStatus(
            member._id,
            !member.isActive,
          )

        const updatedMember =
          response?.member

        if (updatedMember) {
          setMembers(
            (currentMembers) =>
              currentMembers.map(
                (currentMember) =>
                  currentMember._id ===
                  updatedMember._id
                    ? updatedMember
                    : currentMember,
              ),
          )

          setSelectedMember(
            (current) =>
              current?._id ===
              updatedMember._id
                ? updatedMember
                : current,
          )
        }
      } catch (error) {
        console.error(
          "Update member status error:",
          error,
        )

        setError(
          error?.response?.data
            ?.message ||
            "Unable to update member status.",
        )
      } finally {
        setUpdatingStatus(false)
      }
    }

  /*
  |--------------------------------------------------------------------------
  | Summary values
  |--------------------------------------------------------------------------
  */

  const activeMembers =
    members.filter(
      (member) =>
        member.isActive,
    ).length

  const medicalMembers =
    members.filter(
      (member) =>
        member.medicalProfile
          ?.hasMedicalCondition ||
        member.medicalProfile
          ?.conditions ||
        member.medicalProfile
          ?.medications ||
        member.medicalProfile
          ?.allergies ||
        member.medicalProfile
          ?.injuries,
    ).length

  const membersWithEmergencyContact =
    members.filter(
      (member) =>
        Array.isArray(
          member.emergencyContacts,
        ) &&
        member.emergencyContacts
          .length > 0,
    ).length

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-7xl px-5 py-8">
        {/* -------------------------------------------------------------- */}
        {/* Header */}
        {/* -------------------------------------------------------------- */}

        <header>
          <div className="flex items-center gap-2 text-lime-400">
            <Users size={18} />

            <span className="text-xs font-black uppercase tracking-widest">
              {gymName} Admin
            </span>
          </div>

          <div className="mt-2">
            <h1 className="text-3xl font-black">
              Members
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              View members, fitness goals,
              health information, emergency
              contacts and account status.
            </p>
          </div>
        </header>

        {/* -------------------------------------------------------------- */}
        {/* Error */}
        {/* -------------------------------------------------------------- */}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <div>
                <p className="text-sm font-black text-red-400">
                  Unable to load members
                </p>

                <p className="mt-1 text-xs text-red-300/70">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadMembers}
                  className="mt-3 rounded-xl bg-red-400 px-4 py-2 text-xs font-black text-black"
                >
                  TRY AGAIN
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------- */}
        {/* Summary */}
        {/* -------------------------------------------------------------- */}

        <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <SummaryCard
            label="Total Members"
            value={members.length}
            icon={Users}
          />

          <SummaryCard
            label="Active"
            value={activeMembers}
            icon={Activity}
          />

          <SummaryCard
            label="Medical Notes"
            value={medicalMembers}
            icon={AlertTriangle}
          />

          <SummaryCard
            label="Emergency Contacts"
            value={
              membersWithEmergencyContact
            }
            icon={ShieldAlert}
          />

          <SummaryCard
            label="Paid Members"
            value={
              members.filter(
                (member) =>
                  member.subscription?.paymentStatus ===
                    "paid" &&
                  member.subscription?.status ===
                    "active",
              ).length
            }
            icon={CheckCircle2}
          />
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Search */}
        {/* -------------------------------------------------------------- */}

        <section className="mt-6">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search members..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-11 pr-4 text-sm font-bold text-white outline-none placeholder:text-gray-700 focus:border-lime-400"
            />
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Loading */}
        {/* -------------------------------------------------------------- */}

        {loading ? (
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-lime-400" />

            <p className="mt-4 text-sm font-bold text-gray-500">
              Loading members...
            </p>
          </section>
        ) : (
          <section className="mt-6">
            {filteredMembers.length ===
            0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
                <Users
                  size={30}
                  className="mx-auto text-gray-700"
                />

                <p className="mt-4 text-sm font-black">
                  No members found
                </p>

                <p className="mt-1 text-xs text-gray-600">
                  {search
                    ? "Try another search."
                    : "Members who register will appear here."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredMembers.map(
                  (member) => (
                    <MemberCard
                      key={
                        member._id
                      }
                      member={member}
                      onOpen={() =>
                        setSelectedMember(
                          member,
                        )
                      }
                    />
                  ),
                )}
              </div>
            )}
          </section>
        )}
      </main>

      {/* -------------------------------------------------------------- */}
      {/* Member Details */}
      {/* -------------------------------------------------------------- */}

      {selectedMember && (
        <MemberDetails
          member={
            selectedMember
          }
          onClose={() =>
            setSelectedMember(
              null,
            )
          }
          onToggleStatus={
            handleToggleStatus
          }
          updatingStatus={
            updatingStatus
          }
        />
      )}
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Summary Card
|--------------------------------------------------------------------------
*/

function SummaryCard({
  label,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-yellow-400">
        <Icon size={18} />
      </div>

      <p className="mt-4 text-2xl font-black">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-600">
        {label}
      </p>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Member Card
|--------------------------------------------------------------------------
*/

function MemberCard({
  member,
  onOpen,
}) {
  const fullName =
    `${member.firstName || ""} ${
      member.lastName || ""
    }`.trim() ||
    "Unnamed Member"

  const goal =
    goals[
      member.fitnessGoal
    ] || "Not specified"

  const hasMedicalInfo =
    member.medicalProfile
      ?.hasMedicalCondition ||
    member.medicalProfile
      ?.conditions ||
    member.medicalProfile
      ?.medications ||
    member.medicalProfile
      ?.allergies ||
    member.medicalProfile
      ?.injuries

  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .map(
        (name) =>
          name[0],
      )
      .join("")
      .slice(0, 2)
      .toUpperCase()

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-lime-400/30"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black">
          <span className="text-sm font-black">
            {initials}
          </span>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-[9px] font-black ${
            member.isActive
              ? "bg-lime-400/10 text-lime-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {member.isActive
            ? "ACTIVE"
            : "INACTIVE"}
        </span>
      </div>

      <h3 className="mt-5 text-lg font-black">
        {fullName}
      </h3>

      <p className="mt-1 text-xs text-gray-600">
        {goal}
      </p>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[9px] font-black uppercase tracking-wider text-gray-600">
            Subscription
          </span>

          <span
            className={`rounded-full px-2 py-1 text-[8px] font-black ${
              member.subscription?.status === "active"
                ? "bg-lime-400/10 text-lime-400"
                : "bg-white/5 text-gray-600"
            }`}
          >
            {member.subscription?.status === "active"
              ? "PAID"
              : "NO ACTIVE PLAN"}
          </span>
        </div>

        {member.subscription ? (
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="truncate text-xs font-black text-gray-300">
              {member.subscription.planName ||
                member.subscription.membershipPlan?.name ||
                "Membership"}
            </p>

            <p className="shrink-0 text-[10px] font-bold text-gray-500">
              {Math.max(
                0,
                Number(member.subscription.daysRemaining) || 0,
              )} days left
            </p>
          </div>
        ) : (
          <p className="mt-2 text-[10px] text-gray-600">
            No paid subscription recorded.
          </p>
        )}
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Mail size={14} />

          <span className="truncate">
            {member.email}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Phone size={14} />

          <span>
            {member.phone ||
              "No phone provided"}
          </span>
        </div>
      </div>

      {hasMedicalInfo && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-[10px] font-black text-red-400">
          <AlertTriangle size={13} />

          MEDICAL INFORMATION PROVIDED
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
        <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">
          View Member
        </span>

        <ChevronRight
          size={16}
          className="text-gray-600"
        />
      </div>
    </button>
  )
}

/*
|--------------------------------------------------------------------------
| Member Details
|--------------------------------------------------------------------------
*/

function MemberDetails({
  member,
  onClose,
  onToggleStatus,
  updatingStatus,
}) {
  const fullName =
    `${member.firstName || ""} ${
      member.lastName || ""
    }`.trim() ||
    "Unnamed Member"

  const goal =
    goals[
      member.fitnessGoal
    ] || "Not specified"

  const medical =
    member.medicalProfile ||
    {}

  const emergencyContacts =
    Array.isArray(
      member.emergencyContacts,
    )
      ? member.emergencyContacts
      : []

  const height =
    member.height?.value !==
    null &&
    member.height?.value !==
      undefined
      ? `${member.height.value} ${
          member.height.unit ||
          "cm"
        }`
      : "Not provided"

  const weight =
    member.weight?.value !==
    null &&
    member.weight?.value !==
      undefined
      ? `${member.weight.value} ${
          member.weight.unit ||
          "kg"
        }`
      : "Not provided"

  const joinedDate =
    member.createdAt
      ? new Date(
          member.createdAt,
        ).toLocaleDateString()
      : "Not available"

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="mx-auto min-h-full max-w-3xl py-6">
        <div className="rounded-3xl border border-white/10 bg-[#0b0b0b]">
          {/* ---------------------------------------------------------- */}
          {/* Header */}
          {/* ---------------------------------------------------------- */}

          <div className="flex items-start justify-between border-b border-white/10 p-6">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-lime-400">
                Member Profile
              </p>

              <h2 className="mt-1 text-2xl font-black">
                {fullName}
              </h2>

              <p className="mt-1 text-xs text-gray-600">
                {goal}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5"
              aria-label="Close member profile"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6">
            {/* -------------------------------------------------------- */}
            {/* Account status */}
            {/* -------------------------------------------------------- */}

            <DetailSection title="Account Status">
              <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-gray-700">
                    Current Status
                  </p>

                  <p
                    className={`mt-1 text-sm font-black ${
                      member.isActive
                        ? "text-lime-400"
                        : "text-red-400"
                    }`}
                  >
                    {member.isActive
                      ? "Active"
                      : "Inactive"}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    updatingStatus
                  }
                  onClick={() =>
                    onToggleStatus(
                      member,
                    )
                  }
                  className={`rounded-xl px-4 py-3 text-xs font-black ${
                    member.isActive
                      ? "bg-red-400 text-black"
                      : "bg-lime-400 text-black"
                  } disabled:opacity-50`}
                >
                  {updatingStatus
                    ? "UPDATING..."
                    : member.isActive
                      ? "DEACTIVATE MEMBER"
                      : "ACTIVATE MEMBER"}
                </button>
              </div>
            </DetailSection>

            {/* -------------------------------------------------------- */}
            {/* Subscription */}
            {/* -------------------------------------------------------- */}

            <DetailSection title="Subscription & Payment">
              {member.subscription ? (
                <div className="rounded-2xl border border-lime-400/20 bg-lime-400/5 p-5">
                  <DetailGrid>
                    <Detail
                      label="Plan"
                      value={
                        member.subscription.planName ||
                        member.subscription.membershipPlan?.name ||
                        "Not provided"
                      }
                    />

                    <Detail
                      label="Payment Status"
                      value={
                        member.subscription.paymentStatus ||
                        "Unknown"
                      }
                    />

                    <Detail
                      label="Start Date"
                      value={
                        member.subscription.startDate
                          ? new Date(
                              member.subscription.startDate,
                            ).toLocaleDateString()
                          : "Not available"
                      }
                    />

                    <Detail
                      label="Expiry Date"
                      value={
                        member.subscription.endDate
                          ? new Date(
                              member.subscription.endDate,
                            ).toLocaleDateString()
                          : "Not available"
                      }
                    />

                    <Detail
                      label="Days Remaining"
                      value={`${Math.max(
                        0,
                        Number(member.subscription.daysRemaining) || 0,
                      )} days`}
                    />

                    <Detail
                      label="Subscription Status"
                      value={
                        member.subscription.status ||
                        "Unknown"
                      }
                    />
                  </DetailGrid>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/50">
                    <div
                      className={`h-full rounded-full ${
                        Number(member.subscription.percentageRemaining) <= 20
                          ? "bg-red-400"
                          : Number(member.subscription.percentageRemaining) <= 40
                            ? "bg-yellow-400"
                            : "bg-lime-400"
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(0, Number(member.subscription.percentageRemaining) || 0))}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-right text-[10px] font-bold text-gray-600">
                    {Math.min(100, Math.max(0, Number(member.subscription.percentageRemaining) || 0))}% remaining
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-black text-gray-400">
                    No paid subscription recorded.
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    This member has not completed a paid membership activation.
                  </p>
                </div>
              )}
            </DetailSection>

            {/* -------------------------------------------------------- */}
            {/* Personal */}
            {/* -------------------------------------------------------- */}

            <DetailSection title="Personal Information">
              <DetailGrid>
                <Detail
                  label="First Name"
                  value={
                    member.firstName ||
                    "Not provided"
                  }
                />

                <Detail
                  label="Last Name"
                  value={
                    member.lastName ||
                    "Not provided"
                  }
                />

                <Detail
                  label="Age"
                  value={
                    member.age
                      ? `${member.age} years`
                      : "Not provided"
                  }
                />

                <Detail
                  label="Date of Birth"
                  value={
                    member.dateOfBirth
                      ? new Date(
                          member.dateOfBirth,
                        ).toLocaleDateString()
                      : "Not provided"
                  }
                />

                <Detail
                  label="Height"
                  value={height}
                />

                <Detail
                  label="Current Weight"
                  value={weight}
                />

                <Detail
                  label="Fitness Goal"
                  value={goal}
                />
              </DetailGrid>
            </DetailSection>

            {/* -------------------------------------------------------- */}
            {/* Contact */}
            {/* -------------------------------------------------------- */}

            <DetailSection title="Contact Information">
              <DetailGrid>
                <Detail
                  label="Email"
                  value={
                    member.email ||
                    "Not provided"
                  }
                />

                <Detail
                  label="Phone"
                  value={
                    member.phone ||
                    "Not provided"
                  }
                />

                <Detail
                  label="Address"
                  value={
                    member.address ||
                    "Not provided"
                  }
                />

                <Detail
                  label="Joined"
                  value={joinedDate}
                />
              </DetailGrid>
            </DetailSection>

            {/* -------------------------------------------------------- */}
            {/* Fitness Goal */}
            {/* -------------------------------------------------------- */}

            <DetailSection title="Fitness Goal">
              <div className="rounded-2xl border border-lime-400/20 bg-lime-400/5 p-5">
                <p className="text-xs font-black uppercase tracking-wider text-lime-400">
                  Member Goal
                </p>

                <p className="mt-2 text-lg font-black">
                  {goal}
                </p>

                <p className="mt-2 text-xs leading-5 text-gray-500">
                  This goal is selected by
                  the member and can be
                  used by trainers when
                  planning workouts.
                </p>
              </div>
            </DetailSection>

            {/* -------------------------------------------------------- */}
            {/* Medical */}
            {/* -------------------------------------------------------- */}

            <DetailSection title="Medical Information">
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle
                    size={16}
                  />

                  <p className="text-xs font-black uppercase tracking-wider">
                    Trainer Safety Information
                  </p>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Detail
                    label="Medical Condition"
                    value={
                      medical.hasMedicalCondition
                        ? "Yes"
                        : "No"
                    }
                  />

                  <Detail
                    label="Conditions"
                    value={
                      medical.conditions ||
                      "None reported"
                    }
                  />

                  <Detail
                    label="Medications"
                    value={
                      medical.medications ||
                      "None reported"
                    }
                  />

                  <Detail
                    label="Allergies"
                    value={
                      medical.allergies ||
                      "None reported"
                    }
                  />

                  <Detail
                    label="Injuries"
                    value={
                      medical.injuries ||
                      "None reported"
                    }
                  />
                </div>

                {medical.additionalInformation && (
                  <div className="mt-4">
                    <Detail
                      label="Additional Information"
                      value={
                        medical.additionalInformation
                      }
                    />
                  </div>
                )}
              </div>
            </DetailSection>

            {/* -------------------------------------------------------- */}
            {/* Emergency Contacts */}
            {/* -------------------------------------------------------- */}

            <DetailSection title="Emergency Contacts">
              {emergencyContacts.length ===
              0 ? (
                <div className="rounded-2xl bg-white/5 p-4 text-xs text-gray-600">
                  No emergency contact has
                  been provided.
                </div>
              ) : (
                <div className="space-y-3">
                  {emergencyContacts.map(
                    (contact) => (
                      <div
                        key={
                          contact._id
                        }
                        className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4"
                      >
                        <div className="grid gap-4 sm:grid-cols-3">
                          <Detail
                            label="Name"
                            value={
                              contact.name ||
                              "Not provided"
                            }
                          />

                          <Detail
                            label="Relationship"
                            value={
                              contact.relationship ||
                              "Not provided"
                            }
                          />

                          <Detail
                            label="Phone"
                            value={
                              contact.phone ||
                              "Not provided"
                            }
                          />
                        </div>

                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-xs font-black text-black"
                          >
                            <Phone
                              size={15}
                            />
                            CALL EMERGENCY CONTACT
                          </a>
                        )}
                      </div>
                    ),
                  )}
                </div>
              )}
            </DetailSection>

            {/* -------------------------------------------------------- */}
            {/* Workout progress placeholder */}
            {/* -------------------------------------------------------- */}

            <DetailSection title="Workout Progress">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-black uppercase tracking-wider text-lime-400">
                  Training Activity
                </p>

                <p className="mt-2 text-sm font-bold">
                  Workout progress will appear
                  here.
                </p>

                <p className="mt-2 text-xs leading-5 text-gray-600">
                  This section will show the
                  member's assigned workout,
                  completed sets, actual reps,
                  actual weights, completion
                  status and calories burned.
                </p>
              </div>
            </DetailSection>
          </div>
        </div>
      </div>
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Detail Section
|--------------------------------------------------------------------------
*/

function DetailSection({
  title,
  children,
}) {
  return (
    <section className="border-b border-white/10 py-6 first:pt-0 last:border-b-0">
      <h3 className="mb-4 text-sm font-black">
        {title}
      </h3>

      {children}
    </section>
  )
}

/*
|--------------------------------------------------------------------------
| Detail Grid
|--------------------------------------------------------------------------
*/

function DetailGrid({
  children,
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {children}
    </div>
  )
}

/*
|--------------------------------------------------------------------------
| Detail
|--------------------------------------------------------------------------
*/

function Detail({
  label,
  value,
}) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-wider text-gray-700">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-gray-300">
        {value}
      </p>
    </div>
  )
}

export default Members