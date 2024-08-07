
export const cards = [
    {
      cardName: "General Use",
      holder: "Sterling Archer",
      type: "Physical",
      status: "Active",
      limit: {
        amount: "5000",
        cycle: "month",
      },
      cardNumber: "4111111111111111",
      expDate: "12/25",
      cvv: "123",
      billingAddress: "123 Spy Street, New York, NY 10001",
      email: "sterling@isis.com",
    },
    {
      cardName: "Apple Purchases",
      holder: "Lana Kane",
      type: "Virtual",
      status: "Active",
      limit: {
        amount: "1000",
        cycle: "month",
      },
      cardNumber: "5555555555554444",
      expDate: "03/24",
      cvv: "456",
      billingAddress: "456 Agent Avenue, Los Angeles, CA 90001",
      email: "lana@isis.com",
    },
    {
      cardName: "Travel Expenses",
      holder: "Cyril Figgis",
      type: "Physical",
      status: "Inactive",
      limit: {
        amount: "3000",
        cycle: "month",
      },
      cardNumber: "3782822463100005",
      expDate: "09/23",
      cvv: "789",
      billingAddress: "789 Accountant Lane, Chicago, IL 60601",
      email: "cyril@isis.com",
    },
  ];

export const columns = [
    { name: "CARD NAME", uid: "cardName" },
    { name: "HOLDER", uid: "holder" },
    { name: "TYPE", uid: "type" },
    { name: "STATUS", uid: "status" },
    { name: "LIMIT", uid: "limit" },
    { name: "ACTIONS", uid: "actions" },
  ];