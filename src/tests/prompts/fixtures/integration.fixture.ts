import { mockGraph } from "./graph.fixture";
import { mockSpeedPreference } from "./preference.fixture";
import { mockTransactionHistory } from "./transaction.fixture";
import { mockTransferMethods } from "./transfer-method.fixture";
import { mockUser } from "./user.fixture";

export const mockIntegrationScenario = {
    user: mockUser,
    preference: {
        ...mockSpeedPreference,
        context: {
            domains: ["bill-pay"],
            capabilities: ["transfers"],
            priority: "speed"
        }
    },
    transaction: {
        amount: 1000,
        availableMethods: mockTransferMethods,
        userHistory: mockTransactionHistory
    },
    graph: {
        ...mockGraph,
        nodes: {
            "transfers": {
                type: "capability",
                description: "Money transfer functionality",
                requires: ["user-auth"],
                ui_component: "transfers-tab"
            }
        }
    }
};