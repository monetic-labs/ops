import { MentionOption } from "@/types/messaging";
import { knowledgeBase } from "@/libs/openai/retrieve";

export const useMentions = () => {
  const options: MentionOption[] = Object.keys(knowledgeBase).map((category) => ({
    id: category,
    value: category,
    label: category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    description: knowledgeBase[category][0].slice(0, 50) + "...",
    icon: "📚",
  }));

  return { options };
};
