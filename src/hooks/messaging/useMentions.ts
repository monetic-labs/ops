import { useMemo, useCallback } from "react";
import { useMessagingStore, useMessagingActions } from "@/libs/messaging/store";
import { MentionOption } from "@/types/messaging";
import graphData from "@/knowledge-base/v0/graph/graph.json";

export const useMentions = () => {
  const mentionState = useMessagingStore((state) => state.mention);
  const { mention: { setMentionState } } = useMessagingActions();

  const options = useMemo(() => {
    // Get domains and capabilities from graph
    const nodes = Object.entries(graphData.nodes);
    const filteredOptions = nodes
      .filter(([_, node]) => node.type === "domain" || node.type === "capability")
      .map(([id, node]) => ({
        id,
        value: id,
        label: id
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        description: node.description,
        type: node.type,
      }));

    return filteredOptions;
  }, []);

  const getFilteredOptions = useCallback((searchText: string) => {
    return options.filter((option) =>
      option.value.toLowerCase().includes(searchText.toLowerCase()) ||
      option.description?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [options]);

  const handleSelectMention = useCallback((option: MentionOption) => {
    const insertText = `@${option.label.toLowerCase().replace(/\s+/g, '-')}`;
    setMentionState({
      isOpen: false,
      searchText: "",
      selectedIndex: 0,
      position: { top: 0, left: 0 },
    });
    return {
      label: option.label,
      insertText,
      option,
    };
  }, [setMentionState]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!mentionState.isOpen) return;

    const filteredOptions = getFilteredOptions(mentionState.searchText);
    const listElement = document.querySelector('[data-testid="mention-list"]');
    const selectedElement = document.querySelector(`[data-testid="mention-option"]:nth-child(${mentionState.selectedIndex + 1})`);
    
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setMentionState({
          ...mentionState,
          selectedIndex: Math.min(mentionState.selectedIndex + 1, filteredOptions.length - 1),
        });
        // Scroll into view if needed
        if (selectedElement && listElement) {
          const listRect = listElement.getBoundingClientRect();
          const elementRect = selectedElement.getBoundingClientRect();
          if (elementRect.bottom > listRect.bottom) {
            selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        setMentionState({
          ...mentionState,
          selectedIndex: Math.max(mentionState.selectedIndex - 1, 0),
        });
        // Scroll into view if needed
        if (selectedElement && listElement) {
          const listRect = listElement.getBoundingClientRect();
          const elementRect = selectedElement.getBoundingClientRect();
          if (elementRect.top < listRect.top) {
            selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
        break;
      case "Tab":
      case "Enter":
        e.preventDefault();
        if (filteredOptions[mentionState.selectedIndex]) {
          return handleSelectMention(filteredOptions[mentionState.selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setMentionState({ 
          ...mentionState,
          isOpen: false 
        });
        break;
    }
  }, [mentionState, setMentionState, getFilteredOptions, handleSelectMention]);

  const handleInputChange = useCallback((text: string, cursorPosition: number, inputElement?: HTMLInputElement) => {
    const textBeforeCursor = text.slice(0, cursorPosition);
    const words = textBeforeCursor.split(" ");
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith("@")) {
      const searchText = lastWord.slice(1).toLowerCase();
      
      // Calculate position if input element is provided
      let position = mentionState.position;
      if (inputElement) {
        const rect = inputElement.getBoundingClientRect();
        const caretCoords = getCaretCoordinates(inputElement, cursorPosition);
        position = {
          top: rect.top + caretCoords.top + 20, // Add some offset for the input padding
          left: rect.left + caretCoords.left,
        };
      }

      // Show list immediately when @ is typed
      setMentionState({
        isOpen: true,
        searchText: searchText || "", // Empty string when only @ is typed
        selectedIndex: 0,
        position, // Include the position
      });
    } else if (mentionState.isOpen) {
      setMentionState({
        isOpen: false,
        searchText: "",
        selectedIndex: 0,
        position: { top: 0, left: 0 },
      });
    }
  }, [mentionState.isOpen, mentionState.position, setMentionState]);

  // Helper function to get caret coordinates
  const getCaretCoordinates = (element: HTMLInputElement, position: number) => {
    const { offsetLeft, offsetTop, scrollLeft, scrollTop } = element;
    const div = document.createElement('div');
    const style = div.style;
    const computed = window.getComputedStyle(element);

    style.whiteSpace = 'pre-wrap';
    style.position = 'absolute';
    style.visibility = 'hidden';
    style.width = computed.width;
    style.fontSize = computed.fontSize;
    style.fontFamily = computed.fontFamily;
    style.fontWeight = computed.fontWeight;
    style.lineHeight = computed.lineHeight;
    style.padding = computed.padding;

    div.textContent = element.value.substring(0, position);
    document.body.appendChild(div);
    
    const coordinates = {
      top: div.offsetHeight - scrollTop + offsetTop,
      left: div.offsetWidth - scrollLeft + offsetLeft,
    };

    document.body.removeChild(div);
    return coordinates;
  };

  return {
    options,
    mentionState,
    setMentionState,
    getFilteredOptions,
    handleKeyDown,
    handleSelectMention,
    handleInputChange,
  };
};
