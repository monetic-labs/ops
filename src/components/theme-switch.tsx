import { FC, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@nextui-org/button";
import clsx from "clsx";

import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";
import { components } from "@/styles/theme/components";

export interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      className={clsx(components.themeSwitch.base, className)}
      variant="light"
      isIconOnly
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      onPress={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <SunFilledIcon size={22} /> : <MoonFilledIcon size={22} />}
    </Button>
  );
};
