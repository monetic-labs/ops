// Common component styles
export const components = {
  // Layout
  container: "container mx-auto max-w-7xl px-6",
  section: "py-8 md:py-12",
  
  // Cards
  card: {
    base: "card-base",
    body: "p-6",
  },

  // Buttons
  button: {
    base: "transition-opacity hover:opacity-80",
    disabled: "bg-charyo-500/30 text-notpurple-500/60 cursor-not-allowed hover:bg-charyo-500",
  },

  // Theme Switch
  themeSwitch: {
    base: "min-w-unit-10 w-10 h-10 !text-notpurple-500 data-[hover=true]:opacity-80",
  },

  // Navigation
  navbar: {
    base: "navbar-base",
    wrapper: "px-4",
  },

  // Footer
  footer: {
    base: "w-full flex items-center justify-center py-3 gap-4",
    icon: "text-default-500",
  },
}; 