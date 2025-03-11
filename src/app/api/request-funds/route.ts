import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destinationAddress } = body;

    if (!destinationAddress) {
      return NextResponse.json({ error: "Destination address is required" }, { status: 400 });
    }

    // Make the request to Circle's faucet API
    const response = await fetch("https://faucet.circle.com/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operationName: "RequestToken",
        variables: {
          input: {
            destinationAddress,
            token: "USDC",
            blockchain: "BASE",
          },
        },
        query:
          "mutation RequestToken($input: RequestTokenInput!) {\n  requestToken(input: $input) {\n    ...RequestTokenResponseInfo\n    __typename\n  }\n}\n\nfragment RequestTokenResponseInfo on RequestTokenResponse {\n  amount\n  blockchain\n  contractAddress\n  currency\n  destinationAddress\n  explorerLink\n  hash\n  status\n  __typename\n}",
      }),
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error requesting funds:", error);
    return NextResponse.json({ error: "Failed to request funds" }, { status: 500 });
  }
}
