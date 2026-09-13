const MEMBER_STORAGE_KEY =
  "gb_members"

const PROFILE_STORAGE_KEY =
  "gb_member_profile"

const defaultMembers = [
  {
    id: 1,
    fullName: "John Doe",
    email: "john@example.com",
    phone: "08012345678",
    age: 32,
    height: "178 cm",
    weight: "82 kg",
    address: "Kaduna, Nigeria",
    goal: "lose_weight",
    medicalInfo: "None reported",
    emergencyContact: {
      name: "Mary Doe",
      relationship: "Wife",
      phone: "08098765432",
    },
    membershipStatus: "active",
    joinedDate: "2026-01-15",
  },
  {
    id: 2,
    fullName: "Sarah James",
    email: "sarah@example.com",
    phone: "08023456789",
    age: 28,
    height: "165 cm",
    weight: "68 kg",
    address: "Kaduna, Nigeria",
    goal: "keep_fit",
    medicalInfo:
      "No known medical condition reported.",
    emergencyContact: {
      name: "David James",
      relationship: "Brother",
      phone: "08087654321",
    },
    membershipStatus: "active",
    joinedDate: "2026-02-03",
  },
]

function getMembers() {
  try {
    const stored =
      localStorage.getItem(
        MEMBER_STORAGE_KEY,
      )

    const parsed = stored
      ? JSON.parse(stored)
      : defaultMembers

    if (!Array.isArray(parsed)) {
      return defaultMembers
    }

    const profile =
      getMemberProfile()

    /*
     * The current local profile represents
     * the logged-in member.
     *
     * We keep it synchronized with the
     * trainer's member list.
     */
    if (
      profile &&
      profile.fullName &&
      profile.fullName !==
        "GB Member"
    ) {
      const existingIndex =
        parsed.findIndex(
          (member) =>
            member.id ===
              "current-member" ||
            member.email ===
              profile.email,
        )

      const currentMember =
        {
          id: "current-member",
          fullName:
            profile.fullName,
          email:
            profile.email,
          phone:
            profile.phone,
          age:
            profile.age,
          height:
            profile.height,
          weight:
            profile.weight,
          address:
            profile.address,
          goal:
            profile.goal,
          medicalInfo:
            profile.medicalInfo ||
            "None reported",
          emergencyContact:
            profile.emergencyContact,
          membershipStatus:
            "active",
          joinedDate:
            profile.joinedDate ||
            new Date()
              .toISOString()
              .split("T")[0],
        }

      if (existingIndex >= 0) {
        parsed[existingIndex] =
          {
            ...parsed[
              existingIndex
            ],
            ...currentMember,
          }
      } else {
        parsed.push(
          currentMember,
        )
      }

      localStorage.setItem(
        MEMBER_STORAGE_KEY,
        JSON.stringify(parsed),
      )
    }

    return parsed
  } catch (error) {
    console.error(
      "Unable to load members:",
      error,
    )

    return defaultMembers
  }
}

function getMemberProfile() {
  try {
    const stored =
      localStorage.getItem(
        PROFILE_STORAGE_KEY,
      )

    if (!stored) {
      return null
    }

    return JSON.parse(stored)
  } catch {
    return null
  }
}

function saveMembers(members) {
  localStorage.setItem(
    MEMBER_STORAGE_KEY,
    JSON.stringify(members),
  )

  return members
}

function getMember(memberId) {
  return getMembers().find(
    (member) =>
      String(member.id) ===
      String(memberId),
  )
}

function createMember(member) {
  const members =
    getMembers()

  const newMember = {
    ...member,
    id: Date.now(),
    joinedDate:
      new Date()
        .toISOString()
        .split("T")[0],
    membershipStatus:
      member.membershipStatus ||
      "active",
  }

  return saveMembers([
    ...members,
    newMember,
  ])
}

function updateMember(
  memberId,
  changes,
) {
  const members =
    getMembers()

  const updated =
    members.map((member) =>
      String(member.id) ===
      String(memberId)
        ? {
            ...member,
            ...changes,
          }
        : member,
    )

  return saveMembers(
    updated,
  )
}

function deleteMember(
  memberId,
) {
  const members =
    getMembers()

  const updated =
    members.filter(
      (member) =>
        String(member.id) !==
        String(memberId),
    )

  return saveMembers(
    updated,
  )
}

export {
  getMembers,
  saveMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
}