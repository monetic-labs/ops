// Knowledge base for each category
export const knowledgeBase: Record<string, string[]> = {
  "bill-pay": [
    "Bill Pay allows users to schedule and manage payments to vendors and service providers.",
    "Features include recurring payments, payment history, and vendor management.",
    "Supports both ACH and check payments with customizable approval workflows.",
  ],
  "card-issuance": [
    "Card issuance platform supports virtual and physical debit/credit cards.",
    "Includes features for card activation, PIN management, and spend controls.",
    "Supports instant virtual card creation and physical card shipping tracking.",
  ],
  "back-office": [
    "Back office operations include reconciliation, reporting, and account management.",
    "Provides tools for transaction monitoring and dispute resolution.",
    "Includes audit trails and compliance reporting features.",
  ],
  "user-management": [
    "User management includes features for user creation, role-based access control, and user activity monitoring.",
    "Supports multi-factor authentication and user provisioning from external systems.",
    "Includes audit logs and user management reports.",
  ],
  transactions: [
    "Transactions include features for transaction monitoring, dispute resolution, and transaction history.",
  ],
  alerts: ["Alerts include features for transaction monitoring, dispute resolution, and transaction history."],
  compliance: ["Compliance includes features for transaction monitoring, dispute resolution, and transaction history."],
};

export async function retrieveContext(query: string) {
  // Extract mentions from the query (e.g., @bill-pay, @card-issuance)
  const mentions = query.match(/@(\w+-?\w+)/g) || [];

  // Get relevant context based on mentions
  const relevantContext = mentions
    .map((mention) => mention.slice(1)) // Remove @ symbol
    .filter((category) => knowledgeBase[category])
    .flatMap((category) => knowledgeBase[category])
    .join("\n\n");

  // If no specific mentions, return general context
  const defaultContext =
    "I am what happens when the humble ATM gets reimagined as an AI assistant focused on financial technology support. " +
    "I can help with bill pay, card issuance, back office operations, user management, " +
    "transactions, alerts, and compliance. Use @ mentions to get specific information about these topics.";

  return {
    context: relevantContext || defaultContext,
    mentions: mentions,
  };
}
