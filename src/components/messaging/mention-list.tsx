import React from "react";

import { MentionOption } from "@/types/messaging";

interface MentionListProps {
  options: MentionOption[];
  selectedIndex?: number;
  position?: { top: number; left: number };
  onSelect: (option: MentionOption) => void;
}

export const MentionList = React.memo<MentionListProps>(({ options, selectedIndex = -1, position, onSelect }) => {
  return (
    <div
      className="absolute z-[100] bg-content1 rounded-lg shadow-lg max-h-60 overflow-y-auto 
        border border-divider w-full scrollbar-thin scrollbar-track-content2 scrollbar-thumb-content3"
      data-testid="mention-list"
      style={{
        ...(position ? { top: position.top, left: position.left } : { bottom: "100%", marginBottom: "8px", left: 0 }),
      }}
    >
      {options.length === 0 ? (
        <div className="px-4 py-2 text-foreground/50">No matches found</div>
      ) : (
        options.map((option, index) => (
          <button
            key={option.id}
            className={`w-full px-4 py-2 text-left flex flex-col gap-1
              focus:outline-none text-foreground
              ${index === selectedIndex ? "bg-content2" : "hover:bg-content2"}`}
            data-testid="mention-option"
            onClick={() => onSelect(option)}
          >
            <div className="flex items-center gap-2">
              {option.icon && <span className="w-5 h-5">{option.icon}</span>}
              <span className="font-medium">{option.label}</span>
              <span className="text-xs text-foreground/60 px-2 rounded-full border border-divider">
                {option.category || "unknown"}
              </span>
            </div>

            {option.description && <span className="text-sm text-foreground/60">{option.description}</span>}
          </button>
        ))
      )}
    </div>
  );
});

MentionList.displayName = "MentionList";
