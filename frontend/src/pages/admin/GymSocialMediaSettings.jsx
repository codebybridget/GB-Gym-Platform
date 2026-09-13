import { useEffect, useState } from "react"
import {
  Save,
} from "lucide-react"

const STORAGE_KEY =
  "gb_gym_social_media"

const DEFAULTS = {
  facebook: "",
  instagram: "",
  tiktok: "",
  youtube: "",
}

function GymSocialMediaSettings() {
  const [
    values,
    setValues,
  ] = useState(DEFAULTS)

  const [
    saved,
    setSaved,
  ] = useState(false)

  useEffect(() => {
    try {
      const stored =
        JSON.parse(
          localStorage.getItem(
            STORAGE_KEY,
          ) || "{}",
        )

      setValues({
        ...DEFAULTS,
        ...stored,
      })
    } catch {
      setValues(DEFAULTS)
    }
  }, [])

  const update = (
    key,
    value,
  ) => {
    setSaved(false)

    setValues(
      (current) => ({
        ...current,
        [key]: value,
      }),
    )
  }

  const save = (
    event,
  ) => {
    event.preventDefault()

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(values),
    )

    setSaved(true)
  }

  return (
    <div className="min-h-screen bg-black px-5 py-8 text-white">
      <main className="mx-auto max-w-4xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-400">
          GB Gym Settings
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Gym Social Media
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          Add the gym's official social-media
          accounts. These accounts are displayed
          to members; they are not member personal
          accounts.
        </p>

        <form
          onSubmit={save}
          className="mt-7 space-y-4 rounded-3xl border border-white/10 bg-[#0b0b0b] p-6"
        >
          <SocialField
            badge="f"
            label="Facebook"
            value={values.facebook}
            onChange={(value) =>
              update(
                "facebook",
                value,
              )
            }
            placeholder="https://facebook.com/yourgym"
          />

          <SocialField
            badge="ig"
            label="Instagram"
            value={values.instagram}
            onChange={(value) =>
              update(
                "instagram",
                value,
              )
            }
            placeholder="https://instagram.com/yourgym"
          />

          <SocialField
            badge="tt"
            label="TikTok"
            value={values.tiktok}
            onChange={(value) =>
              update(
                "tiktok",
                value,
              )
            }
            placeholder="https://tiktok.com/@yourgym"
          />

          <SocialField
            badge="yt"
            label="YouTube"
            value={values.youtube}
            onChange={(value) =>
              update(
                "youtube",
                value,
              )
            }
            placeholder="https://youtube.com/@yourgym"
          />

          <div className="flex items-center justify-between gap-4 pt-3">
            <p className="text-xs text-lime-300">
              {saved
                ? "Social-media settings saved."
                : ""}
            </p>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl bg-lime-400 px-5 py-3 text-xs font-black text-black"
            >
              <Save size={15} />
              SAVE SOCIAL MEDIA
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

function SocialField({
  badge,
  label,
  value,
  onChange,
  placeholder,
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-500">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-[11px] font-black uppercase text-lime-400">
          {badge}
        </span>

        {label}
      </span>

      <input
        type="url"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-lime-400/40"
      />
    </label>
  )
}

export default GymSocialMediaSettings