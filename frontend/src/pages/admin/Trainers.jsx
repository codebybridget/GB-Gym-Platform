import { useEffect, useState } from "react"

import {
  CheckCircle2,
  Mail,
  Phone,
  Plus,
  Search,
  UserRound,
  X,
  XCircle,
} from "lucide-react"

import {
  createTrainer,
  getTrainers,
  updateTrainerStatus,
} from "../../api/api.js"

function Trainers() {
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    age: "",
    dateOfBirth: "",
    address: "",
    profilePhoto: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const loadTrainers = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await getTrainers()
      setTrainers(Array.isArray(response?.trainers) ? response.trainers : [])
    } catch (err) {
      console.error("Unable to load trainers:", err)
      setError(err?.response?.data?.message || "Unable to load trainers.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTrainers()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const openAddTrainer = () => {
    setError("")
    setSuccess("")
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      age: "",
      dateOfBirth: "",
      address: "",
      profilePhoto: "",
    })
    setShowModal(true)
  }

  const closeModal = () => {
    if (!saving) setShowModal(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError("First name, last name and email are required.")
      return
    }

    try {
      setSaving(true)
      const response = await createTrainer({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        age: form.age === "" ? null : Number(form.age),
        dateOfBirth: form.dateOfBirth || null,
        address: form.address.trim(),
        profilePhoto: form.profilePhoto.trim(),
      })

      setSuccess(response?.message || "Trainer created successfully.")
      setShowModal(false)
      await loadTrainers()
    } catch (err) {
      console.error("Create trainer error:", err)
      setError(err?.response?.data?.message || "Unable to create trainer.")
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (trainer) => {
    const nextStatus = !trainer.isActive
    try {
      setError("")
      setSuccess("")
      await updateTrainerStatus(trainer._id, nextStatus)
      setSuccess(nextStatus ? "Trainer activated successfully." : "Trainer deactivated successfully.")
      await loadTrainers()
    } catch (err) {
      console.error("Update trainer status error:", err)
      setError(err?.response?.data?.message || "Unable to update trainer status.")
    }
  }

  const filteredTrainers = trainers.filter((trainer) => {
    const searchValue = search.trim().toLowerCase()
    if (!searchValue) return true
    const fullName = `${trainer.firstName || ""} ${trainer.lastName || ""}`.toLowerCase()
    return (
      fullName.includes(searchValue) ||
      trainer.email?.toLowerCase().includes(searchValue) ||
      trainer.phone?.toLowerCase().includes(searchValue)
    )
  })

  return (
    <div className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-400">Staff Management</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Trainers</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Manage the trainers who work with your gym members. Trainers are staff accounts and do not require membership plans.
            </p>
          </div>
          <button type="button" onClick={openAddTrainer} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-lime-400 px-5 py-3 text-sm font-black text-black transition hover:bg-lime-300">
            <Plus size={18} /> ADD TRAINER
          </button>
        </div>

        {error && !showModal && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-300">
            <XCircle size={18} className="mt-0.5 shrink-0" /><p>{error}</p>
          </div>
        )}
        {success && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-lime-400/20 bg-lime-400/10 px-4 py-4 text-sm text-lime-300">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" /><p>{success}</p>
          </div>
        )}

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="relative max-w-xl">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
            <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search trainers..." className="w-full rounded-2xl border border-white/10 bg-black px-11 py-3 text-sm text-white outline-none placeholder:text-gray-700 focus:border-lime-400/40" />
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center"><p className="text-sm text-gray-500">Loading trainers...</p></div>
          ) : filteredTrainers.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5"><UserRound size={28} className="text-gray-600" /></div>
              <h2 className="mt-5 text-lg font-black">No trainers found</h2>
              <p className="mt-2 text-sm text-gray-600">{search ? "Try a different search." : "Add your first trainer to get started."}</p>
              {!search && <button type="button" onClick={openAddTrainer} className="mt-6 rounded-2xl bg-lime-400 px-5 py-3 text-sm font-black text-black">ADD FIRST TRAINER</button>}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredTrainers.map((trainer) => {
                const fullName = `${trainer.firstName || ""} ${trainer.lastName || ""}`.trim()
                const initial = trainer.firstName?.charAt(0)?.toUpperCase() || "T"
                return (
                  <div key={trainer._id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-lime-400 text-lg font-black text-black">
                          {trainer.profilePhoto ? <img src={trainer.profilePhoto} alt={fullName} className="h-full w-full object-cover" /> : initial}
                        </div>
                        <div className="min-w-0">
                          <h2 className="truncate text-base font-black">{fullName}</h2>
                          <p className="mt-1 text-xs text-gray-600">Trainer</p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${trainer.isActive ? "bg-lime-400/10 text-lime-400" : "bg-red-400/10 text-red-400"}`}>
                        {trainer.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="mt-5 space-y-3">
                      <div className="flex items-center gap-3 text-sm text-gray-500"><Mail size={16} className="text-gray-700" /><span className="truncate">{trainer.email}</span></div>
                      {trainer.phone && <div className="flex items-center gap-3 text-sm text-gray-500"><Phone size={16} className="text-gray-700" /><span>{trainer.phone}</span></div>}
                    </div>
                    <button type="button" onClick={() => handleStatusChange(trainer)} className={`mt-6 w-full rounded-2xl border px-4 py-3 text-xs font-black transition ${trainer.isActive ? "border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10" : "border-lime-400/20 bg-lime-400/5 text-lime-400 hover:bg-lime-400/10"}`}>
                      {trainer.isActive ? "DEACTIVATE TRAINER" : "ACTIVATE TRAINER"}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#111] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div><p className="text-xs font-bold uppercase tracking-wider text-lime-400">Staff Account</p><h2 className="mt-1 text-xl font-black">Add Trainer</h2></div>
              <button type="button" onClick={closeModal} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white"><X size={19} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {error && <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
              <div className="grid gap-5 sm:grid-cols-2">
                {[
                  ["firstName", "First Name *", "text", true],
                  ["lastName", "Last Name *", "text", true],
                  ["email", "Email *", "email", true],
                  ["phone", "Phone", "text", false],
                  ["dateOfBirth", "Date of Birth", "date", false],
                  ["age", "Age", "number", false],
                ].map(([name, label, type, required]) => (
                  <div key={name}>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">{label}</label>
                    <input type={type} name={name} value={form[name]} onChange={handleChange} required={required} min={type === "number" ? "1" : undefined} max={type === "number" ? "120" : undefined} className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-lime-400/40" />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Address</label>
                  <textarea name="address" value={form.address} onChange={handleChange} rows={3} className="w-full resize-none rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-lime-400/40" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Profile Photo URL</label>
                  <input name="profilePhoto" value={form.profilePhoto} onChange={handleChange} placeholder="Optional" className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-lime-400/40" />
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-lime-400/10 bg-lime-400/5 p-4"><p className="text-xs leading-5 text-gray-500">Trainers do not need a membership plan or a permanent password. They log in using their registered email address and a one-time verification code sent by email.</p></div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button type="button" onClick={closeModal} disabled={saving} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-gray-300 transition hover:bg-white/10 disabled:opacity-50">CANCEL</button>
                <button type="submit" disabled={saving} className="rounded-2xl bg-lime-400 px-4 py-3 text-sm font-black text-black transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "CREATING..." : "CREATE TRAINER"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Trainers
