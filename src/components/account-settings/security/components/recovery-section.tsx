"use client";

import { ChevronUp, ChevronDown } from "lucide-react";

interface RecoverySectionProps {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  isExpanded: boolean;
  isComingSoon?: boolean;
  toggleExpanded: (id: string) => void;
  children?: React.ReactNode;
}

const RecoverySection: React.FC<RecoverySectionProps> = ({
  id,
  title,
  description,
  icon: Icon,
  isExpanded,
  isComingSoon = false,
  toggleExpanded,
  children,
}) => {
  return (
    <div className="border border-divider rounded-lg overflow-hidden">
      <button
        className={`flex items-center justify-between p-4 w-full text-left ${
          isComingSoon ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:bg-default-50"
        }`}
        disabled={isComingSoon}
        onClick={() => !isComingSoon && toggleExpanded(id)}
      >
        <div className="flex items-center gap-3">
          <Icon className="text-foreground/80" size={20} />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium">{title}</h4>
              {isComingSoon && <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Soon</span>}
            </div>
            <p className="text-xs text-foreground/60">{description}</p>
          </div>
        </div>
        <div className="text-foreground/50">
          {isComingSoon ? <ChevronDown size={24} /> : isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
      </button>
      {isExpanded && !isComingSoon && <div className="border-t border-divider">{children}</div>}
    </div>
  );
};

export default RecoverySection;
