import { HugeiconsIcon } from "@hugeicons/react"
import { Moon02FreeIcons, Sun02FreeIcons } from "@hugeicons/core-free-icons"
import { useTheme } from "./theme-provider"

const ThemeToggle = () => {
  const { setTheme, theme } = useTheme()
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="text-sm  cursor-default w-full hover:bg-black/9 dark:hover:bg-white/9 py-1.5 px-2 rounded-sm   font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
    >
      {theme === "dark" ? (
        <span className="flex gap-1.5">
          {" "}
          <HugeiconsIcon size={18} icon={Sun02FreeIcons} />{" "}
          <span>Light Mode</span>
        </span>
      ) : (
        <span className="flex gap-2">
          {" "}
          <HugeiconsIcon size={18} icon={Moon02FreeIcons} />
          <span>Dark Mode</span>
        </span>
      )}
    </button>
  )
}
export default ThemeToggle
