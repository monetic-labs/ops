import { TransferMethod } from "@/prompts/v0/helpers/types";

export const mockTransferMethods: TransferMethod[] = [
    {
        name: "Instant Transfer",
        speed: 1, // minutes
        fee: 15.00,
        feeType: "flat",
    },
    {
        name: "Express Transfer",
        speed: 30, // minutes
        fee: 2.5,
        feeType: "percentage",
    },
    {
        name: "Standard Transfer",
        speed: 180, // minutes
        fee: 0,
        feeType: "flat",
    }
];