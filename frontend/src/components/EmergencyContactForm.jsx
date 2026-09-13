import { Phone, UserRound } from "lucide-react"

function EmergencyContactForm({
  contact,
  onChange,
}) {
  const updateField = (
    field,
    value,
  ) => {
    onChange({
      ...contact,
      [field]: value,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          <UserRound size={13} />
          Contact Name
        </label>

        <input
          type="text"
          value={contact.name}
          onChange={(event) =>
            updateField(
              "name",
              event.target.value,
            )
          }
          placeholder="Full name"
          className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3.5 text-sm font-medium text-white outline-none transition placeholder:text-gray-700 focus:border-lime-400"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
          Relationship
        </label>

        <select
          value={contact.relationship}
          onChange={(event) =>
            updateField(
              "relationship",
              event.target.value,
            )
          }
          className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3.5 text-sm font-medium text-white outline-none focus:border-lime-400"
        >
          <option value="">
            Select relationship
          </option>

          <option value="Parent">
            Parent
          </option>

          <option value="Spouse">
            Spouse
          </option>

          <option value="Sibling">
            Sibling
          </option>

          <option value="Relative">
            Relative
          </option>

          <option value="Friend">
            Friend
          </option>

          <option value="Other">
            Other
          </option>
        </select>
      </div>

      <div>
        <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          <Phone size={13} />
          Phone Number
        </label>

        <input
          type="tel"
          value={contact.phone}
          onChange={(event) =>
            updateField(
              "phone",
              event.target.value,
            )
          }
          placeholder="Emergency contact phone number"
          className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3.5 text-sm font-medium text-white outline-none transition placeholder:text-gray-700 focus:border-lime-400"
        />
      </div>
    </div>
  )
}

export default EmergencyContactForm