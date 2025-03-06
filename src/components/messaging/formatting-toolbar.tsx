import React from "react";
import { Button } from "@nextui-org/button";
import { Tooltip } from "@nextui-org/tooltip";
import { Bold, Italic, Code } from "lucide-react";

interface FormattingToolbarProps {
  onFormat: (format: "bold" | "italic" | "code") => void;
}

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({ onFormat }) => {
  return (
    <div className="flex items-center gap-1 px-2">
      <Tooltip content="Bold">
        <Button isIconOnly size="sm" variant="light" onPress={() => onFormat("bold")}>
          <Bold className="w-4 h-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Italic">
        <Button isIconOnly size="sm" variant="light" onPress={() => onFormat("italic")}>
          <Italic className="w-4 h-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Code">
        <Button isIconOnly size="sm" variant="light" onPress={() => onFormat("code")}>
          <Code className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  );
};
