import { SVGProps } from "react";
import { StoreApi } from "zustand";

import { MessagingStore } from "@/libs/messaging/store";
import { Graph } from "@/knowledge-base/v0/graph/graph";
import { SpeedOverCostPreference } from "@/knowledge-base/v0/types";
import { UsagePattern } from "@/knowledge-base/v0/usage";

import { AgentMessageContext, SupportMessageContext } from "./messaging";
import {
  GetComplianceStatusResponse,
  MerchantRainCompanyStatusOutput,
  BridgeComplianceKycStatus,
  BridgeComplianceTosStatus,
  CardCompanyStatus,
} from "@backpack-fux/pylon-sdk";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type OrderID = `${string}-${string}-${string}-${string}`;

export type ChainAddress = `0x${string}`;

export interface ComplianceStatus extends GetComplianceStatusResponse, MerchantRainCompanyStatusOutput {
  kycStatus: BridgeComplianceKycStatus;
  tosStatus: BridgeComplianceTosStatus;
  status: CardCompanyStatus;
}

export interface ComplianceResponse {
  complianceStatus: ComplianceStatus;
  error?: string;
}

declare global {
  interface Window {
    //__MOCK_WS__?: MockWebSocket;

    __MOCK_AGENT_CONTEXT__?: AgentMessageContext;
    __MOCK_SUPPORT_CONTEXT__?: SupportMessageContext;

    __ACTIVE_MODE__?: "agent" | "support";
    __MESSAGING_STORE__?: StoreApi<MessagingStore> & {
      setState: StoreApi<MessagingStore>["setState"];
      getState: StoreApi<MessagingStore>["getState"];
      subscribe: (listener: (state: MessagingStore) => void) => () => void;
    };

    __TEST_GRAPH__?: Graph;
    __TEST_PREFERENCE__?: SpeedOverCostPreference;
    __TEST_USAGE__?: UsagePattern;
  }
  namespace PlaywrightTest {
    interface Matchers<R> {
      toBeGreaterThan(expected: number): R;
      toBe(expected: any): R;
      toBeVisible(): Promise<void>;
    }
  }
}
