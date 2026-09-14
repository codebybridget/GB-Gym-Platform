import { useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  Building2,
  Search,
  ShieldAlert,
  Trash2,
  UserRound,
  X,
} from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"

import { platform } from "../../api/api"
import { err } from "../../utils/helpers"
import "../../styles/platform.css"


const pageVariants = {
  hidden: {
    opacity: 0,
  },

  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      staggerChildren: 0.06,
    },
  },
}


const itemVariants = {
  hidden: {
    opacity: 0,
    y: 16,
  },

  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },
}


export default function Gyms() {
  const reduceMotion =
    useReducedMotion()

  const [rows, setRows] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [query, setQuery] =
    useState("")

  const [filter, setFilter] =
    useState("all")

  const [updatingId, setUpdatingId] =
    useState("")

  const [deleteTarget, setDeleteTarget] =
    useState(null)

  const [deletingId, setDeletingId] =
    useState("")


  const load = async () => {
    setLoading(true)
    setError("")

    try {
      const data =
        await platform.gyms()

      setRows(
        Array.isArray(data?.gyms)
          ? data.gyms
          : [],
      )
    } catch (e) {
      setError(err(e))
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    load()
  }, [])


  const filtered =
    useMemo(
      () => {
        const normalizedQuery =
          query
            .trim()
            .toLowerCase()

        return rows.filter(
          (gym) => {
            const matchesFilter =
              filter === "all" ||
              (
                filter === "active" &&
                gym.isActive
              ) ||
              (
                filter === "suspended" &&
                !gym.isActive
              )

            if (!matchesFilter) {
              return false
            }

            const searchable =
              [
                gym.name,
                gym.owner?.email,
                gym.subscription
                  ?.plan?.name,
                gym.subscription
                  ?.planName,
                gym.city,
                gym.state,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()

            return searchable.includes(
              normalizedQuery,
            )
          },
        )
      },
      [
        rows,
        query,
        filter,
      ],
    )


  const toggle =
    async (gym) => {
      if (
        !gym?._id ||
        updatingId ||
        deletingId
      ) {
        return
      }

      try {
        setUpdatingId(
          gym._id,
        )

        setError("")

        await platform.updateGym(
          gym._id,
          {
            isActive:
              !gym.isActive,
          },
        )

        setRows(
          (current) =>
            current.map(
              (item) =>
                item._id ===
                gym._id
                  ? {
                      ...item,
                      isActive:
                        !item.isActive,
                    }
                  : item,
            ),
        )
      } catch (e) {
        setError(err(e))
      } finally {
        setUpdatingId("")
      }
    }


  const deleteGym =
    async () => {
      if (
        !deleteTarget?._id ||
        deletingId
      ) {
        return
      }

      try {
        setDeletingId(
          deleteTarget._id,
        )

        setError("")

        await platform.deleteGym(
          deleteTarget._id,
        )

        setRows(
          (current) =>
            current.filter(
              (gym) =>
                gym._id !==
                deleteTarget._id,
            ),
        )

        setDeleteTarget(null)
      } catch (e) {
        setError(err(e))
      } finally {
        setDeletingId("")
      }
    }


  const totalGyms =
    rows.length

  const activeGyms =
    rows.filter(
      (gym) =>
        gym.isActive,
    ).length

  const suspendedGyms =
    rows.filter(
      (gym) =>
        !gym.isActive,
    ).length


  return (
    <>
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="platform-page"
      >
        <div className="platform-wrap">

          {/* Header */}

          <motion.div
            variants={itemVariants}
            className="platform-head"
          >
            <div>
              <div className="platform-eyebrow">
                <i />

                <Building2
                  size={13}
                />

                <span>
                  TENANT MANAGEMENT
                </span>
              </div>

              <h1>
                Gyms
              </h1>

              <p>
                Manage every tenant on the
                GB platform.
              </p>
            </div>
          </motion.div>


          {/* Error */}

          {error && (
            <motion.div
              initial={{
                opacity: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="p-alert error"
            >
              {error}
            </motion.div>
          )}


          {/* KPI strip */}

          <motion.div
            variants={itemVariants}
            className="p-kpi-strip"
            style={{
              marginBottom: 16,
            }}
          >
            <Mini
              label="Total gyms"
              value={
                loading
                  ? "—"
                  : totalGyms
              }
            />

            <Mini
              label="Active"
              value={
                loading
                  ? "—"
                  : activeGyms
              }
            />

            <Mini
              label="Suspended"
              value={
                loading
                  ? "—"
                  : suspendedGyms
              }
            />
          </motion.div>


          {/* Main panel */}

          <motion.section
            variants={itemVariants}
            className="p-panel"
          >

            {/* Toolbar */}

            <div className="p-toolbar">

              <div className="p-search">
                <Search
                  size={16}
                />

                <input
                  type="search"
                  placeholder="Search gym, owner or plan..."
                  value={query}
                  onChange={(
                    event,
                  ) =>
                    setQuery(
                      event.target.value,
                    )
                  }
                />
              </div>


              <select
                className="p-select"
                value={filter}
                onChange={(
                  event,
                ) =>
                  setFilter(
                    event.target.value,
                  )
                }
              >
                <option value="all">
                  All gyms
                </option>

                <option value="active">
                  Active
                </option>

                <option value="suspended">
                  Suspended
                </option>
              </select>

            </div>


            {/* Loading */}

            {loading ? (
              <LoadingState />
            ) : filtered.length ? (
              <>
                {/* Desktop/tablet */}

                <div className="p-table-wrap hidden md:block">
                  <table className="p-table">
                    <thead>
                      <tr>
                        <th>
                          Gym
                        </th>

                        <th>
                          Owner
                        </th>

                        <th>
                          Plan
                        </th>

                        <th>
                          Subscription
                        </th>

                        <th>
                          Access
                        </th>

                        <th>
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filtered.map(
                        (
                          gym,
                          index,
                        ) => (
                          <GymTableRow
                            key={
                              gym._id
                            }
                            gym={
                              gym
                            }
                            index={
                              index
                            }
                            updatingId={
                              updatingId
                            }
                            deletingId={
                              deletingId
                            }
                            reduceMotion={
                              reduceMotion
                            }
                            onToggle={
                              toggle
                            }
                            onDelete={
                              setDeleteTarget
                            }
                          />
                        ),
                      )}
                    </tbody>
                  </table>
                </div>


                {/* Mobile cards */}

                <div className="grid gap-3 md:hidden">
                  {filtered.map(
                    (
                      gym,
                      index,
                    ) => (
                      <GymMobileCard
                        key={
                          gym._id
                        }
                        gym={
                          gym
                        }
                        index={
                          index
                        }
                        updatingId={
                          updatingId
                        }
                        deletingId={
                          deletingId
                        }
                        reduceMotion={
                          reduceMotion
                        }
                        onToggle={
                          toggle
                        }
                        onDelete={
                          setDeleteTarget
                        }
                      />
                    ),
                  )}
                </div>
              </>
            ) : (
              <Empty />
            )}

          </motion.section>

        </div>
      </motion.div>


      {/* Delete confirmation modal */}

      {deleteTarget && (
        <DeleteModal
          gym={deleteTarget}
          deleting={
            deletingId ===
            deleteTarget._id
          }
          onCancel={() =>
            !deletingId &&
            setDeleteTarget(null)
          }
          onConfirm={
            deleteGym
          }
        />
      )}
    </>
  )
}


/*
|--------------------------------------------------------------------------
| Desktop gym row
|--------------------------------------------------------------------------
*/

function GymTableRow({
  gym,
  index,
  updatingId,
  deletingId,
  reduceMotion,
  onToggle,
  onDelete,
}) {
  const isUpdating =
    updatingId ===
    gym._id

  const isDeleting =
    deletingId ===
    gym._id

  return (
    <motion.tr
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              y: 8,
            }
      }
      animate={
        reduceMotion
          ? {}
          : {
              opacity: 1,
              y: 0,
            }
      }
      transition={{
        delay:
          index * 0.035,
        duration: 0.25,
      }}
      whileHover={
        reduceMotion
          ? {}
          : {
              backgroundColor:
                "rgba(255,255,255,0.025)",
            }
      }
    >
      <td>
        <GymIdentity
          gym={gym}
        />
      </td>

      <td>
        <span className="p-muted">
          {gym.owner?.email ||
            "—"}
        </span>
      </td>

      <td>
        <b>
          {gym.subscription
            ?.plan?.name ||
            gym.subscription
              ?.planName ||
            "—"}
        </b>
      </td>

      <td>
        <Badge
          value={
            gym.subscription
              ?.status ||
            "none"
          }
        />
      </td>

      <td>
        <Badge
          value={
            gym.isActive
              ? "active"
              : "suspended"
          }
        />
      </td>

      <td>
        <div className="flex flex-wrap items-center gap-2">

          <ActionButton
            gym={gym}
            updating={
              isUpdating
            }
            disabled={
              isDeleting
            }
            onToggle={
              onToggle
            }
          />

          <DeleteButton
            gym={gym}
            deleting={
              isDeleting
            }
            disabled={
              isUpdating
            }
            onDelete={
              onDelete
            }
          />

        </div>
      </td>
    </motion.tr>
  )
}


/*
|--------------------------------------------------------------------------
| Mobile gym card
|--------------------------------------------------------------------------
*/

function GymMobileCard({
  gym,
  index,
  updatingId,
  deletingId,
  reduceMotion,
  onToggle,
  onDelete,
}) {
  const isUpdating =
    updatingId ===
    gym._id

  const isDeleting =
    deletingId ===
    gym._id

  return (
    <motion.article
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              y: 14,
            }
      }
      animate={
        reduceMotion
          ? {}
          : {
              opacity: 1,
              y: 0,
            }
      }
      transition={{
        delay:
          index * 0.045,
        duration: 0.3,
      }}
      whileTap={
        reduceMotion
          ? {}
          : {
              scale: 0.99,
            }
      }
      className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <GymIdentity
          gym={gym}
        />

        <Badge
          value={
            gym.isActive
              ? "active"
              : "suspended"
          }
        />
      </div>


      <div className="mt-4 grid grid-cols-2 gap-2">

        <MobileInfo
          icon={
            <UserRound
              size={13}
            />
          }
          label="Owner"
          value={
            gym.owner?.email ||
            "—"
          }
        />

        <MobileInfo
          label="Plan"
          value={
            gym.subscription
              ?.plan?.name ||
            gym.subscription
              ?.planName ||
            "—"
          }
        />

        <MobileInfo
          label="Subscription"
          value={
            gym.subscription
              ?.status ||
            "none"
          }
        />

        <MobileInfo
          label="Location"
          value={
            gym.city ||
            gym.state ||
            "—"
          }
        />

      </div>


      <div className="mt-4 grid grid-cols-2 gap-2">

        <motion.button
          type="button"
          disabled={
            isUpdating ||
            isDeleting
          }
          onClick={() =>
            onToggle(gym)
          }
          whileTap={{
            scale: 0.98,
          }}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-black transition ${
            gym.isActive
              ? "bg-red-500/10 text-red-300 hover:bg-red-500/15"
              : "bg-lime-400 text-black hover:bg-lime-300"
          } disabled:opacity-50`}
        >
          {isUpdating ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              UPDATING
            </>
          ) : (
            <>
              {gym.isActive
                ? "SUSPEND"
                : "ACTIVATE"}

              <ArrowRight
                size={14}
              />
            </>
          )}
        </motion.button>


        <motion.button
          type="button"
          disabled={
            isUpdating ||
            isDeleting
          }
          onClick={() =>
            onDelete(gym)
          }
          whileTap={{
            scale: 0.98,
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-3 text-xs font-black text-red-300 transition hover:bg-red-500/15 disabled:opacity-50"
        >
          <Trash2
            size={14}
          />

          {isDeleting
            ? "DELETING..."
            : "DELETE"}
        </motion.button>

      </div>
    </motion.article>
  )
}


/*
|--------------------------------------------------------------------------
| Gym identity
|--------------------------------------------------------------------------
*/

function GymIdentity({
  gym,
}) {
  const initials =
    getInitials(
      gym?.name,
    )

  return (
    <div className="p-gym">
      <motion.div
        whileHover={{
          scale: 1.05,
        }}
        className="p-gym-logo"
      >
        {initials}
      </motion.div>

      <div className="min-w-0">
        <b className="block break-words">
          {gym?.name ||
            "Unnamed gym"}
        </b>

        <span>
          {gym?.city ||
            gym?.state ||
            "GB tenant"}
        </span>
      </div>
    </div>
  )
}


/*
|--------------------------------------------------------------------------
| Action button
|--------------------------------------------------------------------------
*/

function ActionButton({
  gym,
  updating,
  disabled,
  onToggle,
}) {
  return (
    <motion.button
      type="button"
      disabled={
        updating ||
        disabled
      }
      className={`p-btn small ${
        gym.isActive
          ? "danger"
          : "primary"
      }`}
      onClick={() =>
        onToggle(gym)
      }
      whileTap={{
        scale: 0.96,
      }}
    >
      {updating
        ? "Updating..."
        : gym.isActive
          ? "Suspend"
          : "Activate"}
    </motion.button>
  )
}


/*
|--------------------------------------------------------------------------
| Delete button
|--------------------------------------------------------------------------
*/

function DeleteButton({
  gym,
  deleting,
  disabled,
  onDelete,
}) {
  return (
    <motion.button
      type="button"
      disabled={
        deleting ||
        disabled
      }
      onClick={() =>
        onDelete(gym)
      }
      whileTap={{
        scale: 0.96,
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-black text-red-300 transition hover:border-red-500/30 hover:bg-red-500/15 disabled:opacity-50"
    >
      <Trash2
        size={14}
      />

      {deleting
        ? "Deleting..."
        : "Delete"}
    </motion.button>
  )
}


/*
|--------------------------------------------------------------------------
| Delete confirmation modal
|--------------------------------------------------------------------------
*/

function DeleteModal({
  gym,
  deleting,
  onCancel,
  onConfirm,
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(
        event,
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onCancel()
        }
      }}
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 18,
          scale: 0.97,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.25,
        }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-red-500/20 bg-[#0d1219] shadow-2xl"
      >

        {/* Modal header */}

        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
              <Trash2
                size={19}
              />
            </div>

            <div>
              <h2 className="text-base font-black text-white">
                Delete Gym
              </h2>

              <p className="text-xs text-gray-500">
                Permanent tenant removal
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={deleting}
            onClick={
              onCancel
            }
            className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            <X
              size={18}
            />
          </button>
        </div>


        {/* Modal body */}

        <div className="px-5 py-5">

          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">

            <p className="text-sm font-bold text-white">
              Are you sure you want to delete{" "}
              <span className="text-lime-300">
                {gym?.name ||
                  "this gym"}
              </span>
              ?
            </p>

            <p className="mt-2 text-xs leading-5 text-gray-400">
              This will permanently remove the
              gym tenant, its gym users, and its
              gym subscription records.
            </p>

          </div>


          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] p-4">

            <p className="text-[10px] font-black uppercase tracking-wider text-gray-600">
              This action cannot be undone
            </p>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              Platform financial transaction
              records are preserved for billing
              and audit purposes.
            </p>

          </div>

        </div>


        {/* Modal actions */}

        <div className="flex flex-col-reverse gap-2 border-t border-white/10 p-4 sm:flex-row sm:justify-end">

          <button
            type="button"
            disabled={deleting}
            onClick={
              onCancel
            }
            className="rounded-xl border border-white/10 px-4 py-3 text-xs font-black text-gray-300 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            Cancel
          </button>

          <motion.button
            type="button"
            disabled={deleting}
            onClick={
              onConfirm
            }
            whileTap={{
              scale: 0.97,
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-xs font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2
                  size={14}
                />
                Delete Gym
              </>
            )}
          </motion.button>

        </div>

      </motion.div>
    </div>
  )
}


/*
|--------------------------------------------------------------------------
| Mobile information
|--------------------------------------------------------------------------
*/

function MobileInfo({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-black/20 p-3">
      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-gray-600">
        {icon}
        {label}
      </div>

      <p className="mt-1 break-words text-xs font-bold text-gray-300">
        {value}
      </p>
    </div>
  )
}


/*
|--------------------------------------------------------------------------
| KPI
|--------------------------------------------------------------------------
*/

function Mini({
  label,
  value,
}) {
  return (
    <motion.div
      whileHover={{
        y: -2,
      }}
      className="p-mini"
    >
      <span>
        {label}
      </span>

      <motion.strong
        key={String(value)}
        initial={{
          opacity: 0,
          scale: 0.8,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
      >
        {value}
      </motion.strong>
    </motion.div>
  )
}


/*
|--------------------------------------------------------------------------
| Badge
|--------------------------------------------------------------------------
*/

function Badge({
  value,
}) {
  const normalized =
    String(
      value ||
        "none",
    ).toLowerCase()

  return (
    <span
      className={`p-badge ${normalized}`}
    >
      {value ||
        "—"}
    </span>
  )
}


/*
|--------------------------------------------------------------------------
| Loading
|--------------------------------------------------------------------------
*/

function LoadingState() {
  return (
    <div className="grid gap-3">
      {[1, 2, 3].map(
        (item) => (
          <motion.div
            key={item}
            initial={{
              opacity: 0.4,
            }}
            animate={{
              opacity: [
                0.35,
                0.7,
                0.35,
              ],
            }}
            transition={{
              duration: 1.3,
              repeat: Infinity,
              delay:
                item * 0.12,
            }}
            className="h-16 rounded-2xl bg-white/5"
          />
        ),
      )}

      <p className="text-center text-xs font-bold text-gray-600">
        Loading gyms...
      </p>
    </div>
  )
}


/*
|--------------------------------------------------------------------------
| Empty
|--------------------------------------------------------------------------
*/

function Empty() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="p-empty"
    >
      <motion.div
        animate={{
          y: [0, -3, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="p-empty-icon"
      >
        <ShieldAlert
          size={22}
        />
      </motion.div>

      <h3>
        No gyms found
      </h3>

      <p>
        Try another search or
        filter.
      </p>
    </motion.div>
  )
}


/*
|--------------------------------------------------------------------------
| Initials
|--------------------------------------------------------------------------
*/

function getInitials(
  name,
) {
  const value =
    String(
      name || "G",
    ).trim()

  if (!value) {
    return "G"
  }

  const words =
    value
      .split(/\s+/)
      .filter(Boolean)

  if (
    words.length ===
    1
  ) {
    return words[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    words[0][0] +
    words[1][0]
  ).toUpperCase()
}