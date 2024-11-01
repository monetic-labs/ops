import { headers } from "next/headers";

import { getWebSocketServer } from "@/libs/websocket";

export async function GET(request: Request) {
  const headersList = headers();
  const upgrade = headersList.get("upgrade");

  console.log("Upgrade:", { upgrade });

  if (!upgrade || upgrade !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  try {
    const wss = getWebSocketServer();
    const { socket, response } = Reflect.get(request, "socket");

    console.log("Socket:", { socket });
    if (!socket) {
      console.error("No socket found on request");

      return new Response("Socket not found", { status: 500 });
    }

    // Create a more compatible request object
    const reqHeaders = Object.fromEntries(request.headers);
    const nodeRequest = new Object() as any;

    nodeRequest.headers = reqHeaders;
    nodeRequest.method = request.method;
    nodeRequest.url = request.url;

    // Perform the upgrade
    wss.handleUpgrade(nodeRequest as any, socket as any, Buffer.from(""), (ws) => {
      console.log("WebSocket connection established");
      wss.emit("connection", ws);
    });

    return response || new Response(null, { status: 101 });
  } catch (err) {
    console.error("WebSocket upgrade error:", err);

    return new Response("Failed to upgrade WebSocket connection", { status: 500 });
  }
}
