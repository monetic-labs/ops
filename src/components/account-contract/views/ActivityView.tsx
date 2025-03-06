import { Button } from "@nextui-org/button";
import { Filter, Download, Clock, CheckCircle, PenTool } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { Tooltip } from "@nextui-org/tooltip";

import { TransferActivity } from "@/types/account";

interface ActivityViewProps {
  activities: TransferActivity[];
  isLoading?: boolean;
}

export function ActivityView({ activities, isLoading = false }: ActivityViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-6 w-32 bg-content3 rounded-md animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-content3 rounded-md animate-pulse" />
            <div className="h-8 w-20 bg-content3 rounded-md animate-pulse" />
          </div>
        </div>

        {/* Skeleton activity items */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-content2 p-4 rounded-xl animate-pulse">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-content3 rounded-full" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-content3 rounded-md" />
                  <div className="h-3 w-24 bg-content3 rounded-md" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-content3 rounded-md" />
                <div className="h-3 w-16 bg-content3 rounded-md ml-auto" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

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
                  {activity.signers.map((signer) => (
                    <Tooltip
                      key={signer.address}
                      content={`${signer.name} ${signer.hasSigned ? "has signed" : "needs to sign"}`}
                    >
                      <div className="relative">
                        <Image
                          alt={signer.name}
                          className="rounded-full border-2 border-background"
                          height={24}
                          src={signer.image}
                          width={24}
                        />
                        <div
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                            signer.hasSigned ? "bg-success" : "bg-warning"
                          }`}
                        />
                      </div>
                    </Tooltip>
                  ))}
                </div>
                <Button
                  className="bg-content3 text-primary hover:bg-content4"
                  size="sm"
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
            className="flex-1 md:flex-none bg-content2 hover:bg-content3"
            size="sm"
            startContent={<Filter className="w-4 h-4" />}
            variant="flat"
          >
            Filter
          </Button>
          <Button
            className="flex-1 md:flex-none bg-content2 hover:bg-content3"
            size="sm"
            startContent={<Download className="w-4 h-4" />}
            variant="flat"
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
