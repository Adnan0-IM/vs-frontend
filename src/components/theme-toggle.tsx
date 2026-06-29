import { HugeiconsIcon } from "@hugeicons/react"
import { Moon02FreeIcons, Sun02FreeIcons } from "@hugeicons/core-free-icons"
import { useTheme } from "./theme-provider"
import { Button } from "./ui/button"

const ThemeToggle = () => {
  const { setTheme, theme } = useTheme()
  return (
    <Button
      variant={"ghost"}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <HugeiconsIcon icon={Sun02FreeIcons} />
      ) : (
        <HugeiconsIcon icon={Moon02FreeIcons} />
      )}{" "}
    </Button>
  )
}
export default ThemeToggle
