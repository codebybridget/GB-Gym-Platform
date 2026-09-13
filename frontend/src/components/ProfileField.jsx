function ProfileField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
        {label}

        {required && (
          <span className="ml-1 text-yellow-400">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3.5 text-sm font-medium text-white outline-none transition placeholder:text-gray-700 focus:border-lime-400"
      />
    </div>
  )
}

export default ProfileField