export interface OperatorAvatar {
  id: string;
  name: string;
  image: string;
  hasSigned: boolean;
}

export interface TransferActivity {
  id: string;
  type: "internal" | "external";
  status: "pending" | "completed" | "failed";
  amount: number;
  from: {
    id: string;
    name: string;
  };
  to: {
    id: string;
    name: string;
  };
  timestamp: Date;
  requiredSignatures: number;
  currentSignatures: number;
  operators: Array<OperatorAvatar>;
}
