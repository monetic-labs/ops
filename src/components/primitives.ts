import { tv } from "tailwind-variants";

export const title = tv({
  base: "inline font-semibold tracking-tight",
  variants: {
    color: {
      charyo: "text-charyo-500",
      ualert: "text-ualert-500",
      notpurple: "text-notpurple-500",
      gruel: "text-gruel-500",

      chardient: "from-[#999999] to-[#0d0d0d]",
      alertient: "from-[#ffc0f7] to-[#660050]",
      notient: "from-[#faf9fd] to-[#636365]",

      yellow: "from-[#FF705B] to-[#FFB457]",
      blue: "from-[#5EA2EF] to-[#0072F5]",
      cyan: "from-[#00b7fa] to-[#01cfea]",
      green: "from-[#6FEE8D] to-[#17c964]",
      pink: "from-[#FF72E1] to-[#F54C7A]",
      foreground: "dark:from-[#FFFFFF] dark:to-[#4B4B4B]",
    },
    size: {
      sm: "text-3xl lg:text-4xl",
      md: "text-[2.3rem] leading-9 lg:text-5xl",
      lg: "text-4xl lg:text-6xl",
    },
    fullWidth: {
      true: "block w-full",
    },
  },
  defaultVariants: {
    size: "md",
  },
  compoundVariants: [
    {
      color: [
        "chardient",
        "alertient",
        "notient",

        "yellow",
        "blue",
        "cyan",
        "green",
        "pink",

        "foreground",
      ],
      class: "bg-gradient-to-b bg-clip-text text-transparent",
    },
  ],
});

export const subtitle = tv({
  base: "my-2 block w-full max-w-full text-lg text-default-600 md:w-1/2 lg:text-xl",
  variants: {
    fullWidth: {
      true: "!w-full",
    },
    color: {
      charyo: "text-charyo-500",
      ualert: "text-ualert-500",
      notpurple: "text-notpurple-500",
      gruel: "text-gruel-500",

      chardient: "from-[#999999] to-[#0d0d0d]",
      alertient: "from-[#ffc0f7] to-[#660050]",
      notient: "from-[#faf9fd] to-[#636365]",

      yellow: "from-[#FF705B] to-[#FFB457]",
      blue: "from-[#5EA2EF] to-[#0072F5]",
      cyan: "from-[#00b7fa] to-[#01cfea]",
      green: "from-[#6FEE8D] to-[#17c964]",
      pink: "from-[#FF72E1] to-[#F54C7A]",
      foreground: "dark:from-[#FFFFFF] dark:to-[#4B4B4B]",
    },
    size: {
      sm: "text-3xl lg:text-4xl",
      md: "text-[2.3rem] leading-9 lg:text-5xl",
      lg: "text-4xl lg:text-6xl",
    },
  },
  defaultVariants: {
    fullWidth: true,
  },
});
