import { Button } from "@nextui-org/button";
import { Filter, Download, Clock, CheckCircle, PenTool } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { Tooltip } from "@nextui-org/tooltip";
import { TransferActivity } from "../types";

interface ActivityViewProps {
  activities: TransferActivity[];
}

export function ActivityView({ activities }: ActivityViewProps) {
  const renderActivityItem = (activity: TransferActivity) => {
    const isPending = activity.status === "pending";
    const needsSignature = isPending && activity.currentSignatures < activity.requiredSignatures;

    return (
      <div
        key={activity.id}
        className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-content2 hover:bg-content3 transition-colors rounded-lg gap-4"
      >
        <div className="flex items-start md:items-center gap-3">
          <div className={`p-2 rounded-full ${isPending ? "bg-content3" : "bg-content3"}`}>
            {isPending ? (
              <Clock className="w-4 h-4 text-foreground/60" />
            ) : (
              <CheckCircle className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <p className="font-medium">Transfer to {activity.to.name}</p>
              {needsSignature && (
                <span className="px-2 py-0.5 text-xs bg-content3 text-warning rounded-full w-fit">
                  Needs {activity.requiredSignatures - activity.currentSignatures} signature
                  {activity.requiredSignatures - activity.currentSignatures > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p className="text-sm text-foreground/60">{formatDistanceToNow(activity.timestamp, { addSuffix: true })}</p>
            {needsSignature && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex -space-x-2">
                  {activity.operators.map((operator) => (
                    <Tooltip
                      key={operator.id}
                      content={`${operator.name} ${operator.hasSigned ? "has signed" : "needs to sign"}`}
                    >
                      <div className="relative">
                        <Image
                          src={operator.image}
                          alt={operator.name}
                          width={24}
                          height={24}
                          className="rounded-full border-2 border-background"
                        />
                        <div
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                            operator.hasSigned ? "bg-success" : "bg-warning"
                          }`}
                        />
                      </div>
                    </Tooltip>
                  ))}
                </div>
                <Button
                  size="sm"
                  className="bg-content3 text-primary hover:bg-content4"
                  startContent={<PenTool className="w-3 h-3" />}
                >
                  Sign
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between md:justify-end items-center gap-4 md:text-right">
          <div>
            <p className={`font-medium text-foreground`}>${activity.amount.toLocaleString()}</p>
            <p className="text-sm text-foreground/60">{activity.type} transfer</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <span className="px-2 py-0.5 text-xs bg-default-200 text-default-700 rounded-full">Coming Soon</span>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            size="sm"
            variant="flat"
            className="flex-1 md:flex-none bg-content2 hover:bg-content3"
            startContent={<Filter className="w-4 h-4" />}
          >
            Filter
          </Button>
          <Button
            size="sm"
            variant="flat"
            className="flex-1 md:flex-none bg-content2 hover:bg-content3"
            startContent={<Download className="w-4 h-4" />}
          >
            Export
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {activities.length > 0 ? (
          activities.map(renderActivityItem)
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-foreground/60">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
