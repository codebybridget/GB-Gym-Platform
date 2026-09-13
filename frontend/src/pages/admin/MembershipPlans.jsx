import {
  useEffect,
  useState,
} from "react"

import {
  Check,
  Edit3,
  LoaderCircle,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react"

import {
  getAllMembershipPlans,
  createMembershipPlan,
  updateMembershipPlan,
  deleteMembershipPlan,
} from "../../api/api.js"

import { useGym } from "../../context/GymContext"


const emptyForm = {
  name: "",
  description: "",
  durationDays: "",
  price: "",
  currency: "NGN",
  features: "",
  displayOrder: "0",
  isActive: true,
}


function formatPrice(
  price,
  currency = "NGN",
) {
  return new Intl.NumberFormat(
    "en-NG",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    },
  ).format(price)
}


function MembershipPlans() {
  const { gym } = useGym() || {}

  const gymName =
    gym?.name?.trim() || "Gym"

  const [
    plans,
    setPlans,
  ] = useState([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState("")

  const [
    success,
    setSuccess,
  ] = useState("")

  const [
    showForm,
    setShowForm,
  ] = useState(false)

  const [
    editingPlan,
    setEditingPlan,
  ] = useState(null)

  const [
    form,
    setForm,
  ] = useState(emptyForm)


  /*
  |--------------------------------------------------------------------------
  | Load Plans
  |--------------------------------------------------------------------------
  */

  const loadPlans =
    async () => {
      try {
        setLoading(true)
        setError("")

        const response =
          await getAllMembershipPlans()

        setPlans(
          response?.plans ||
          [],
        )
      } catch (requestError) {
        console.error(
          "Load membership plans error:",
          requestError,
        )

        setError(
          requestError?.message ||
          "Unable to load membership plans.",
        )
      } finally {
        setLoading(false)
      }
    }


  useEffect(() => {
    loadPlans()
  }, [])


  /*
  |--------------------------------------------------------------------------
  | Form Helpers
  |--------------------------------------------------------------------------
  */

  const openCreateForm =
    () => {
      setEditingPlan(null)

      setForm({
        ...emptyForm,
      })

      setError("")
      setSuccess("")
      setShowForm(true)
    }


  const openEditForm =
    (plan) => {
      setEditingPlan(plan)

      setForm({
        name:
          plan.name ||
          "",

        description:
          plan.description ||
          "",

        durationDays:
          String(
            plan.durationDays ||
            "",
          ),

        price:
          String(
            plan.price ??
            "",
          ),

        currency:
          plan.currency ||
          "NGN",

        features:
          Array.isArray(
            plan.features,
          )
            ? plan.features.join(
                "\n",
              )
            : "",

        displayOrder:
          String(
            plan.displayOrder ??
            0,
          ),

        isActive:
          plan.isActive !==
          false,
      })

      setError("")
      setSuccess("")
      setShowForm(true)
    }


  const closeForm =
    () => {
      if (saving) {
        return
      }

      setShowForm(false)
      setEditingPlan(null)
      setForm({
        ...emptyForm,
      })
      setError("")
    }


  const handleChange =
    (event) => {
      const {
        name,
        value,
        type,
        checked,
      } = event.target

      setForm(
        (current) => ({
          ...current,

          [name]:
            type === "checkbox"
              ? checked
              : value,
        }),
      )
    }


  /*
  |--------------------------------------------------------------------------
  | Save Plan
  |--------------------------------------------------------------------------
  */

  const handleSubmit =
    async (event) => {
      event.preventDefault()

      setError("")
      setSuccess("")

      const name =
        form.name.trim()

      const durationDays =
        Number(
          form.durationDays,
        )

      const price =
        Number(
          form.price,
        )

      if (!name) {
        setError(
          "Please enter a membership plan name.",
        )

        return
      }

      if (
        !Number.isFinite(
          durationDays,
        ) ||
        durationDays <= 0
      ) {
        setError(
          "Please enter a valid duration in days.",
        )

        return
      }

      if (
        !Number.isFinite(
          price,
        ) ||
        price < 0
      ) {
        setError(
          "Please enter a valid membership price.",
        )

        return
      }

      const features =
        form.features
          .split("\n")
          .map(
            (feature) =>
              feature.trim(),
          )
          .filter(Boolean)

      const planData = {
        name,

        description:
          form.description.trim(),

        durationDays,

        price,

        currency:
          form.currency
            .trim()
            .toUpperCase() ||
          "NGN",

        features,

        displayOrder:
          Number(
            form.displayOrder,
          ) || 0,

        isActive:
          Boolean(
            form.isActive,
          ),
      }

      try {
        setSaving(true)

        if (editingPlan) {
          await updateMembershipPlan(
            editingPlan._id,
            planData,
          )

          setSuccess(
            "Membership plan updated successfully.",
          )
        } else {
          await createMembershipPlan(
            planData,
          )

          setSuccess(
            "Membership plan created successfully.",
          )
        }

        await loadPlans()

        setShowForm(false)
        setEditingPlan(null)

        setForm({
          ...emptyForm,
        })
      } catch (requestError) {
        console.error(
          "Save membership plan error:",
          requestError,
        )

        setError(
          requestError?.message ||
          "Unable to save membership plan.",
        )
      } finally {
        setSaving(false)
      }
    }


  /*
  |--------------------------------------------------------------------------
  | Toggle Plan
  |--------------------------------------------------------------------------
  */

  const handleToggle =
    async (plan) => {
      setError("")
      setSuccess("")

      try {
        await updateMembershipPlan(
          plan._id,
          {
            isActive:
              !plan.isActive,
          },
        )

        setSuccess(
          plan.isActive
            ? "Membership plan deactivated."
            : "Membership plan activated.",
        )

        await loadPlans()
      } catch (requestError) {
        console.error(
          "Toggle membership plan error:",
          requestError,
        )

        setError(
          requestError?.message ||
          "Unable to update membership plan.",
        )
      }
    }


  /*
  |--------------------------------------------------------------------------
  | Delete / Deactivate Plan
  |--------------------------------------------------------------------------
  */

  const handleDelete =
    async (plan) => {
      const confirmed =
        window.confirm(
          `Deactivate "${plan.name}"?`,
        )

      if (!confirmed) {
        return
      }

      setError("")
      setSuccess("")

      try {
        await deleteMembershipPlan(
          plan._id,
        )

        setSuccess(
          "Membership plan deactivated successfully.",
        )

        await loadPlans()
      } catch (requestError) {
        console.error(
          "Delete membership plan error:",
          requestError,
        )

        setError(
          requestError?.message ||
          "Unable to deactivate membership plan.",
        )
      }
    }


  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-black px-4 py-10 text-white sm:px-6 lg:px-8">

        <div className="flex min-h-[50vh] items-center justify-center">

          <div className="text-center">

            <LoaderCircle
              size={32}
              className="mx-auto animate-spin text-lime-400"
            />

            <p className="mt-4 text-sm text-gray-500">
              Loading membership plans...
            </p>

          </div>

        </div>

      </div>
    )
  }


  return (
    <div className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* ============================================================ */}
        {/* HEADER                                                        */}
        {/* ============================================================ */}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-400">
              Membership
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Membership Plans
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Create and manage the membership plans available to{" "}
              {gymName} members.
            </p>

          </div>

          <button
            type="button"
            onClick={
              openCreateForm
            }
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-lime-400 px-5 py-3 text-sm font-black text-black transition hover:bg-lime-300"
          >

            <Plus
              size={18}
            />

            Add Membership Plan

          </button>

        </div>


        {/* ============================================================ */}
        {/* ALERTS                                                        */}
        {/* ============================================================ */}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-2xl border border-lime-400/20 bg-lime-400/10 px-5 py-4 text-sm text-lime-300">
            {success}
          </div>
        )}


        {/* ============================================================ */}
        {/* CREATE / EDIT FORM                                            */}
        {/* ============================================================ */}

        {showForm && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-600">
                  {editingPlan
                    ? "Edit Plan"
                    : "New Plan"}
                </p>

                <h2 className="mt-1 text-xl font-black">
                  {editingPlan
                    ? "Update Membership Plan"
                    : "Create Membership Plan"}
                </h2>

              </div>

              <button
                type="button"
                onClick={
                  closeForm
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white"
              >
                <X
                  size={19}
                />
              </button>

            </div>


            <form
              onSubmit={
                handleSubmit
              }
              className="mt-7 space-y-6"
            >

              <div className="grid gap-5 md:grid-cols-2">

                {/* Name */}

                <div>

                  <label
                    htmlFor="membership-name"
                    className="mb-2 block text-sm font-bold text-gray-300"
                  >
                    Plan Name
                  </label>

                  <input
                    id="membership-name"
                    name="name"
                    value={
                      form.name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. Monthly Membership"
                    disabled={
                      saving
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-lime-400/50"
                  />

                </div>


                {/* Currency */}

                <div>

                  <label
                    htmlFor="membership-currency"
                    className="mb-2 block text-sm font-bold text-gray-300"
                  >
                    Currency
                  </label>

                  <input
                    id="membership-currency"
                    name="currency"
                    value={
                      form.currency
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="NGN"
                    disabled={
                      saving
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm uppercase text-white outline-none transition placeholder:text-gray-700 focus:border-lime-400/50"
                  />

                </div>


                {/* Price */}

                <div>

                  <label
                    htmlFor="membership-price"
                    className="mb-2 block text-sm font-bold text-gray-300"
                  >
                    Price
                  </label>

                  <input
                    id="membership-price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.price
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="20000"
                    disabled={
                      saving
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-lime-400/50"
                  />

                </div>


                {/* Duration */}

                <div>

                  <label
                    htmlFor="membership-duration"
                    className="mb-2 block text-sm font-bold text-gray-300"
                  >
                    Duration (Days)
                  </label>

                  <input
                    id="membership-duration"
                    name="durationDays"
                    type="number"
                    min="1"
                    step="1"
                    value={
                      form.durationDays
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="30"
                    disabled={
                      saving
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-lime-400/50"
                  />

                </div>


                {/* Display Order */}

                <div>

                  <label
                    htmlFor="membership-order"
                    className="mb-2 block text-sm font-bold text-gray-300"
                  >
                    Display Order
                  </label>

                  <input
                    id="membership-order"
                    name="displayOrder"
                    type="number"
                    min="0"
                    step="1"
                    value={
                      form.displayOrder
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      saving
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-lime-400/50"
                  />

                </div>


                {/* Active */}

                <div className="flex items-end">

                  <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/50 px-4 py-3">

                    <input
                      type="checkbox"
                      name="isActive"
                      checked={
                        form.isActive
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        saving
                      }
                      className="h-4 w-4 accent-lime-400"
                    />

                    <span className="text-sm font-bold text-gray-300">
                      Plan is active
                    </span>

                  </label>

                </div>

              </div>


              {/* Description */}

              <div>

                <label
                  htmlFor="membership-description"
                  className="mb-2 block text-sm font-bold text-gray-300"
                >
                  Description
                </label>

                <textarea
                  id="membership-description"
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  rows={3}
                  placeholder="Describe what this membership includes."
                  disabled={
                    saving
                  }
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-lime-400/50"
                />

              </div>


              {/* Features */}

              <div>

                <label
                  htmlFor="membership-features"
                  className="mb-2 block text-sm font-bold text-gray-300"
                >
                  Features
                </label>

                <textarea
                  id="membership-features"
                  name="features"
                  value={
                    form.features
                  }
                  onChange={
                    handleChange
                  }
                  rows={5}
                  placeholder={
                    "Gym access\nAccess to workout programs\nProgress tracking"
                  }
                  disabled={
                    saving
                  }
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-lime-400/50"
                />

                <p className="mt-2 text-xs text-gray-600">
                  Enter one feature per line.
                </p>

              </div>


              {/* Actions */}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-gray-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-6 py-3 text-sm font-black text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving && (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {editingPlan
                    ? "Save Changes"
                    : "Create Plan"}

                </button>

              </div>

            </form>

          </div>
        )}


        {/* ============================================================ */}
        {/* PLAN LIST                                                     */}
        {/* ============================================================ */}

        {!plans.length ? (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center">

            <p className="text-lg font-black">
              No membership plans yet
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Create your first {gymName} membership plan.
            </p>

            <button
              type="button"
              onClick={
                openCreateForm
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-lime-400 px-5 py-3 text-sm font-black text-black"
            >
              <Plus
                size={17}
              />
              Create Plan
            </button>

          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {plans.map(
              (plan) => (
                <div
                  key={
                    plan._id
                  }
                  className={`flex flex-col rounded-3xl border p-6 ${
                    plan.isActive
                      ? "border-white/10 bg-white/[0.04]"
                      : "border-red-500/10 bg-red-500/[0.03] opacity-70"
                  }`}
                >

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <p className="text-xs font-bold uppercase tracking-wider text-gray-600">
                        {plan.durationDays}{" "}
                        {plan.durationDays ===
                        1
                          ? "Day"
                          : "Days"}
                      </p>

                      <h2 className="mt-1 text-xl font-black">
                        {plan.name}
                      </h2>

                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                        plan.isActive
                          ? "bg-lime-400/10 text-lime-400"
                          : "bg-red-400/10 text-red-400"
                      }`}
                    >
                      {plan.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>

                  </div>


                  <div className="mt-6">

                    <p className="text-3xl font-black">
                      {formatPrice(
                        plan.price,
                        plan.currency,
                      )}
                    </p>

                  </div>


                  {plan.description && (
                    <p className="mt-4 text-sm leading-6 text-gray-500">
                      {plan.description}
                    </p>
                  )}


                  <div className="mt-5 flex-1">

                    {plan.features?.length ? (
                      <ul className="space-y-2">

                        {plan.features.map(
                          (
                            feature,
                            index,
                          ) => (
                            <li
                              key={`${plan._id}-${index}`}
                              className="flex items-start gap-2 text-sm text-gray-400"
                            >

                              <Check
                                size={15}
                                className="mt-0.5 shrink-0 text-lime-400"
                              />

                              <span>
                                {feature}
                              </span>

                            </li>
                          ),
                        )}

                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600">
                        No features added.
                      </p>
                    )}

                  </div>


                  {/* Actions */}

                  <div className="mt-7 grid grid-cols-3 gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        openEditForm(
                          plan,
                        )
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-3 text-xs font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
                    >

                      <Edit3
                        size={15}
                      />

                      Edit

                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        handleToggle(
                          plan,
                        )
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-3 text-xs font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
                    >

                      <Power
                        size={15}
                      />

                      {plan.isActive
                        ? "Off"
                        : "On"}

                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          plan,
                        )
                      }
                      className="flex items-center justify-center gap-2 rounded-xl bg-red-500/5 px-3 py-3 text-xs font-bold text-red-400 transition hover:bg-red-500/10"
                    >

                      <Trash2
                        size={15}
                      />

                      Delete

                    </button>

                  </div>

                </div>
              ),
            )}

          </div>
        )}

      </div>

    </div>
  )
}

export default MembershipPlans