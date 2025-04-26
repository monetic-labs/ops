// This main settings page can redirect to the first section (e.g., API Keys)
// Or it can show an overview/welcome message.
// For now, let's just add a simple placeholder.

import Link from "next/link";
import { settingsSections, type SettingsSection, type SettingsNavItem } from "./layout";
import { Accordion, AccordionItem } from "@heroui/accordion";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Mobile/Tablet Navigation Accordion - Hidden on Desktop */}
      <div className="block lg:hidden">
        <Accordion selectionMode="multiple" variant="splitted" itemClasses={{ content: "pb-0 pt-0" }}>
          {settingsSections.map((section: SettingsSection) => (
            <AccordionItem
              key={section.title}
              aria-label={section.title}
              title={<span className="font-semibold text-foreground/80">{section.title}</span>}
            >
              <ul className="space-y-1 pt-2 pb-3">
                {section.items.map((item: SettingsNavItem) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="flex items-center rounded-md p-3 text-sm font-medium text-foreground/80 hover:bg-content2 hover:text-foreground transition-colors"
                    >
                      {item.icon && <span className="mr-3 text-foreground/70">{item.icon}</span>}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Desktop Welcome/Placeholder - Hidden on Mobile/Tablet */}
      <div className="hidden lg:block">
        <h1 className="text-2xl font-semibold mb-4">Organization Settings</h1>
        <p className="text-foreground/60">
          Select a category from the left menu to manage your organization&apos;s settings.
        </p>
      </div>
    </div>
  );
}
