import { useEffect, useMemo } from "react";
import { MentionOption } from "@/types/messaging";
import { Graph } from "@/knowledge-base/v0/graph/graph";
import graphData from "@/knowledge-base/v0/graph/graph.json";
import React from "react";

interface MentionListProps {
  options: MentionOption[];
  searchText: string;
  onSelect: (option: MentionOption) => void;
  position: { top: number; left: number };
  visible: boolean;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
}

export const MentionList = React.memo<MentionListProps>(({
  options,
  searchText,
  onSelect,
  position,
  visible,
  selectedIndex,
  setSelectedIndex,
}) => {
  // Memoize getRelatedInfo to prevent recreation on every render
  const getRelatedInfo = useMemo(() => (nodeKey: string) => {
    const graph = graphData as Graph;
    const node = graph.nodes[nodeKey];
    
    if (!node) return null;

    const capabilities = graph.edges
      .filter(edge => edge.from === nodeKey && edge.relationship === "provides")
      .map(edge => graph.nodes[edge.to])
      .filter(Boolean);

    return {
      type: node.type,
      capabilities,
      requires: node.requires || []
    };
  }, []); // Empty deps since graphData is static

  // Memoize filteredOptions to prevent recalculation on every render
  const filteredOptions = useMemo(() => {
    if (!visible) return [];
    return options.filter((option) => {
      const searchLower = searchText.toLowerCase();
      const relatedInfo = getRelatedInfo(option.value);
      return (
        option.label.toLowerCase().includes(searchLower) ||
        (option.description && option.description.toLowerCase().includes(searchLower)) ||
        (relatedInfo?.capabilities && relatedInfo.capabilities.some(cap => 
          cap.description.toLowerCase().includes(searchLower)
        ))
      );
    });
  }, [visible, options, searchText, getRelatedInfo]);


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
        filteredOptions.map((option, index) => {
          const relatedInfo = getRelatedInfo(option.value);
          
          return (
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
                  {relatedInfo?.type || 'unknown'}
                </span>
              </div>
              
              {option.description && (
                <span className="text-sm text-gray-400">{option.description}</span>
              )}
              
              {relatedInfo?.capabilities && relatedInfo.capabilities.length > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  <span className="font-medium">Capabilities: </span>
                  {relatedInfo.capabilities
                    .map(cap => cap.description.split('.')[0])
                    .join(', ')}
                </div>
              )}
              
              {relatedInfo?.requires && relatedInfo.requires.length > 0 && (
                <div className="text-xs text-gray-400">
                  <span className="font-medium">Requires: </span>
                  {relatedInfo.requires.join(', ')}
                </div>
              )}
            </button>
          );
        })
      )}
    </div>
  );
});

MentionList.displayName = 'MentionList';