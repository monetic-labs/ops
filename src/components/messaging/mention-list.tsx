import { useMemo } from "react";
import React from "react";

import { MentionOption } from "@/types/messaging";
import { Graph } from "@/knowledge-base/v0/graph/graph";
import graphData from "@/knowledge-base/v0/graph/graph.json";

interface MentionListProps {
  options: MentionOption[];
  searchText: string;
  onSelect: (option: MentionOption) => void;
  position: { top: number; left: number };
  visible: boolean;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
}

export const MentionList = React.memo<MentionListProps>(
  ({ options, searchText, onSelect, position, visible, selectedIndex, setSelectedIndex }) => {
    // Memoize filteredOptions to prevent recalculation on every render
    const filteredOptions = useMemo(() => {
      if (!visible) return [];

      // Show all options when only @ is typed (searchText is empty)
      if (!searchText.trim()) {
        return options;
      }

      return options.filter((option) => {
        const searchLower = searchText.toLowerCase();
        return (
          option.label.toLowerCase().includes(searchLower) ||
          (option.description && option.description.toLowerCase().includes(searchLower))
        );
      });
    }, [visible, searchText, options]);

    // Handle no results
    if (!visible) {
      return null;
    }

    return (
      <div
        className="absolute z-[100] bg-charyo-500 rounded-lg shadow-lg max-h-60 overflow-y-auto 
          border border-charyo-600 w-full"
        data-testid="mention-list"
        style={{
          bottom: "100%",
          marginBottom: "8px",
          left: 0,
        }}
      >
        {filteredOptions.length === 0 ? (
          <div className="px-4 py-2 text-gray-400">No matches found</div>
        ) : (
          filteredOptions.map((option, index) => (
            <button
              key={option.id}
              className={`w-full px-4 py-2 text-left flex flex-col gap-1
                focus:outline-none text-notpurple-500
                ${index === selectedIndex ? "bg-charyo-600" : "hover:bg-charyo-600"}`}
              data-testid="mention-option"
              onClick={() => onSelect(option)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-center gap-2">
                {option.icon && <span className="w-5 h-5">{option.icon}</span>}
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-gray-400 px-2 rounded-full border border-gray-400">
                  {option.category || "unknown"}
                </span>
              </div>

              {option.description && (
                <span className="text-sm text-gray-400">{option.description}</span>
              )}
            </button>
          ))
        )}
      </div>
    );
  }
);

MentionList.displayName = "MentionList";
