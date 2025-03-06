import { Activity, Building2, Shield, Users2 } from "lucide-react";
import { Button } from "@nextui-org/button";

export function SkeletonAccountHeader() {
  return (
    <div className="sticky top-0 z-20 flex flex-col md:flex-row md:items-center gap-4 md:gap-0 justify-between p-4 md:px-6 md:py-4 bg-content1/80 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <Button
          className="w-full md:w-auto px-3 md:px-4 py-2 h-auto bg-content2 hover:bg-content3 shadow-card hover:shadow-hover transition-all duration-200 border border-border"
          variant="light"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-xl bg-primary/10 animate-pulse">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col items-start">
              <div className="h-5 w-20 bg-content3 rounded-md animate-pulse" />
              <div className="h-3 w-16 bg-content3 rounded-md mt-1 animate-pulse" />
            </div>
          </div>
        </Button>
      </div>

      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-1">
        <span className="text-sm text-foreground/60">Total Balance</span>
        <div className="h-6 w-24 bg-content3 rounded-md animate-pulse" />
      </div>
    </div>
  );
}

export function SkeletonAccountBalance() {
  return (
    <div className="bg-content2 p-4 rounded-xl mb-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <div className="h-4 w-28 bg-content3 rounded-md animate-pulse mb-2" />
          <div className="h-8 w-32 bg-content3 rounded-md animate-pulse mt-1" />
          <div className="h-4 w-16 bg-content3 rounded-md animate-pulse mt-2" />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button disabled className="flex-1 md:flex-none h-10 bg-content3 animate-pulse">
            <div className="h-4 w-16 bg-content4 rounded-md" />
          </Button>
          <Button disabled className="flex-1 md:flex-none h-10 bg-content3 animate-pulse">
            <div className="h-4 w-16 bg-content4 rounded-md" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SkeletonActivityView() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-6 w-28 bg-content3 rounded-md animate-pulse" />
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-content3 rounded-md animate-pulse" />
          <div className="h-8 w-20 bg-content3 rounded-md animate-pulse" />
        </div>
      </div>

      {/* Skeleton activity items */}
      {[1, 2].map((i) => (
        <div key={i} className="bg-content2 p-4 rounded-xl animate-pulse">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-content3 rounded-full" />
              <div className="space-y-2">
                <div className="h-4 w-28 bg-content3 rounded-md" />
                <div className="h-3 w-20 bg-content3 rounded-md" />
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

export function SkeletonAccountCard() {
  return (
    <div className="w-full bg-content1/90 border border-border backdrop-blur-sm relative">
      <SkeletonAccountHeader />
      <div className="p-4 space-y-4 border-t border-border">
        <SkeletonAccountBalance />

        {/* Skeleton Navigation */}
        <div className="flex border-b border-border">
          {[
            { name: "Activity", icon: Activity },
            { name: "Signers", icon: Users2 },
            { name: "Policies", icon: Shield },
          ].map((tab, i) => (
            <div key={i} className={`flex items-center gap-2 px-4 py-2 ${i === 0 ? "border-b-2 border-primary" : ""}`}>
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </div>
          ))}
        </div>

        <SkeletonActivityView />
      </div>
    </div>
  );
}
