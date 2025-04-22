import React from "react";
import { Card } from "@heroui/card";

// Reusable Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  className?: string;
}

export const StatCard = ({ title, value, icon, className = "" }: StatCardProps) => (
  <Card className={`p-4 ${className} shadow-sm border border-default`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-foreground-500">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-foreground">{value}</h3>
      </div>
      <div className="p-2 rounded-full bg-primary/10 text-primary">{icon}</div>
    </div>
  </Card>
);
