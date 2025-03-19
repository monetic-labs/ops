export const SAFE_WEBAUTHN_SIGNER_SINGLETON = [
  {
    inputs: [],
    name: "getConfiguration",
    outputs: [
      { internalType: "uint256", name: "x", type: "uint256" },
      { internalType: "uint256", name: "y", type: "uint256" },
      { internalType: "P256.Verifiers", name: "verifiers", type: "uint176" },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "message", type: "bytes32" },
      { internalType: "bytes", name: "signature", type: "bytes" },
    ],
    name: "isValidSignature",
    outputs: [{ internalType: "bytes4", name: "magicValue", type: "bytes4" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes", name: "data", type: "bytes" },
      { internalType: "bytes", name: "signature", type: "bytes" },
    ],
    name: "isValidSignature",
    outputs: [{ internalType: "bytes4", name: "magicValue", type: "bytes4" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
