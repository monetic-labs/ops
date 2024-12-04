import { useMemo } from 'react';
import { MentionOption } from "@/types/messaging";
import { knowledgeBase } from "@/libs/openai/retrieve";

export const useMentions = () => {
  const options = useMemo(() => 
    Object.keys(knowledgeBase).map((category) => ({
      id: category,
      value: category,
      label: category
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      description: knowledgeBase[category][0].slice(0, 50) + "...",
      icon: "KB" // Changed from emoji to plain text
    })), 
    [] // Dependencies array is empty since knowledgeBase is static
  );

  return { options };
};