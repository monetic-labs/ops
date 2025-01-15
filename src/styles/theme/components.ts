// Common component styles
export const components = {
  // Layout
  container: "container mx-auto max-w-7xl px-6",
  section: "py-8 md:py-12",
  
  // Cards
  card: {
    base: "card-base",
    body: "p-6",
    financial: {
      base: "bg-content1 border shadow-sm hover:shadow-md transition-all duration-200 p-6",
      container: "w-full max-w-7xl mx-auto bg-background/60 dark:bg-background/50 border-[1px] border-black dark:border-white",
      total: {
        wrapper: "bg-content1 border-blue-400 border-2 p-6 hover:shadow-md transition-all duration-200",
        text: "text-[#1849A9]",
        label: "text-black/60 dark:text-white/60",
      },
      income: {
        wrapper: "bg-content1 border-green-400 border-2 p-6 hover:shadow-md transition-all duration-200",
        text: "text-[#039855]",
        label: "text-black/60 dark:text-white/60",
      },
      expense: {
        wrapper: "bg-content1 border-red-400 border-2 p-6 hover:shadow-md transition-all duration-200",
        text: "text-[#E31B54]",
        label: "text-black/60 dark:text-white/60",
      },
      account: {
        wrapper: "bg-content1 border border-black/[0.08] dark:border-white/[0.08] p-6 hover:shadow-md transition-all duration-200",
        text: "text-black dark:text-white",
        label: "text-black/60 dark:text-white/60",
        disabled: "opacity-50 cursor-not-allowed",
      },
    },
    tabs: {
      classNames: {
        base: [
          "w-full max-w-7xl mx-auto",
          "bg-background/60 dark:bg-background/50",
          "border border-black dark:border-white"
        ],
        body: "p-0"
      }
    },
  },

  // Modals
  modal: {
    base: {
      wrapper: "bg-black/80",
      base: "bg-content1",
      body: "p-0",
    },
    transfer: {
      header: {
        wrapper: "flex items-center justify-between px-5 py-4 border-b border-divider",
        title: "text-xl font-normal text-foreground",
        closeButton: "text-default-400 hover:text-foreground transition-colors",
      },
      content: {
        wrapper: "p-4",
        section: "space-y-3",
      },
      accountSection: {
        wrapper: "rounded-2xl bg-content2 p-4 border border-divider hover:border-divider-400 transition-colors",
        header: {
          wrapper: "flex justify-between mb-2",
          label: "text-sm text-default-400",
        },
        input: {
          wrapper: "flex items-center gap-3",
          button: "h-11 px-4 bg-content3 hover:bg-content4 text-foreground border border-divider transition-all duration-200",
        },
        error: "mt-2 text-sm text-danger",
      },
      swapButton: {
        wrapper: "flex justify-center -my-2 z-10",
        button: "bg-content1 border border-divider w-8 h-8 text-default-400 hover:text-foreground hover:border-divider-400 transition-all duration-200",
      },
      details: {
        wrapper: "space-y-3 px-1",
        row: "flex justify-between",
        label: "text-default-400",
        value: "text-foreground font-medium",
        tooltip: "bg-content2 text-foreground",
        icon: "text-default-400 cursor-help",
      },
      footer: {
        wrapper: "p-4 pt-2",
        button: "w-full h-12 text-base font-medium bg-primary hover:bg-primary-500 text-primary-foreground transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
      },
      divider: "my-4 bg-divider",
    },
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