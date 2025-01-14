import React, { useState } from "react";
import { Tooltip } from "@nextui-org/tooltip";
import { Snippet } from "@nextui-org/snippet";

interface IDSnippetProps {
  id: string;
  label?: string;
}

export default function IDSnippet({ id, label = "ID" }: IDSnippetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500">{label}:</span>
      <Tooltip content={copied ? "Copied!" : "Click to copy"} placement="top">
        <Snippet color="default" symbol="" variant="flat" onCopy={handleCopy}>
          {id}
        </Snippet>
      </Tooltip>
    </div>
  );
}
