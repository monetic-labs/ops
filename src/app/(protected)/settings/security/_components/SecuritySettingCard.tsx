"use client";

import React from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { LucideIcon } from "lucide-react";

interface SecuritySettingCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  statusChip?: React.ReactNode;
  children: React.ReactNode;
  cardClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

const SecuritySettingCard: React.FC<SecuritySettingCardProps> = ({
  title,
  description,
  icon: Icon,
  statusChip,
  children,
  cardClassName = "border border-divider shadow-sm",
  headerClassName = "pb-2",
  bodyClassName = "pt-2",
}) => {
  return (
    <Card shadow="none" classNames={{ base: cardClassName }}>
      <CardHeader className={headerClassName}>
        <div className="flex items-start justify-between w-full gap-4">
          <div className="flex items-center gap-3 flex-grow">
            <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-md flex-shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-grow">
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm text-notpurple-700 dark:text-foreground-400 mt-0.5">{description}</p>
            </div>
          </div>
          {statusChip && <div className="flex-shrink-0 mt-1">{statusChip}</div>}
        </div>
      </CardHeader>
      <CardBody className={bodyClassName}>{children}</CardBody>
    </Card>
  );
};

export default SecuritySettingCard;
