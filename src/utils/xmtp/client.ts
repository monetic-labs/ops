import { Client, DecodedMessage, Signer } from "@xmtp/xmtp-js";
import { WebAuthnHelper } from "@/utils/webauthn";
import { Hex } from "viem";
import { Signature } from "ox";
import { WebAuthnSafeAccountHelper } from "@/utils/safeAccount";

export interface GroupMessage {
  id: string;
  senderAddress: string;
  content: string;
  sent: Date;
}

export class XMTPService {
  private static clients: Map<string, Client> = new Map();
  private client: Client | null = null;
  private account: WebAuthnSafeAccountHelper;
  private readonly BACKPACK_GROUP_PREFIX = "backpack:merchant:";
  private readonly XMTP_ENV: "local" | "dev" | "production" | undefined;
  private readonly SUPPORT_ADDRESS: string;
  private initialized: Promise<void>;
  private conversation: Promise<any>;

  constructor(account: WebAuthnSafeAccountHelper, merchantId?: string) {
    this.account = account;

    // Environment-specific XMTP configurations
    this.XMTP_ENV = process.env.NEXT_PUBLIC_XMTP_ENV === "production" ? "production" : "dev";

    const supportAddress = process.env.NEXT_PUBLIC_BACKPACK_SUPPORT_ADDRESS;
    if (!supportAddress) {
      throw new Error("NEXT_PUBLIC_BACKPACK_SUPPORT_ADDRESS is not set");
    }
    this.SUPPORT_ADDRESS = supportAddress;

    // Start initialization immediately in constructor
    this.initialized = this.initializeClient();

    // Initialize merchant group if merchantId is provided
    this.conversation = merchantId
      ? this.initialized.then(() => this.initMerchantGroup(merchantId))
      : Promise.resolve(null);
  }

  private toXmtpSigner(): Signer {
    return {
      getAddress: async () => this.account.getAddress(),
      signMessage: async (message: string) => {
        const webAuthn = new WebAuthnHelper(window.location.hostname);
        const { rawSignature } = await webAuthn.signMessage(message as Hex);
        const signature = Signature.toHex(rawSignature);
        return signature as string;
      },
    };
  }

  private getMerchantGroupId(merchantId: string): string {
    return `${this.BACKPACK_GROUP_PREFIX}${merchantId}`;
  }

  private async initializeClient(): Promise<void> {
    const address = this.account.getAddress();

    // Return existing client if available
    if (XMTPService.clients.has(address)) {
      this.client = XMTPService.clients.get(address)!;
      return;
    }

    try {
      // Create a new XMTP client using the WebAuthn signer
      this.client = await Client.create(this.toXmtpSigner(), { env: this.XMTP_ENV });
      XMTPService.clients.set(address, this.client);
    } catch (error) {
      console.error("Error creating XMTP client:", error);
      throw error;
    }
  }

  async canMessage(address: string): Promise<boolean> {
    try {
      return await Client.canMessage(address, { env: this.XMTP_ENV });
    } catch (error) {
      console.error("Error checking XMTP identity:", error);
      return false;
    }
  }

  private async initMerchantGroup(merchantId: string) {
    await this.initialized;
    const groupId = this.getMerchantGroupId(merchantId);

    // Create or load the conversation
    return await this.client!.conversations.newConversation(this.SUPPORT_ADDRESS, {
      conversationId: groupId,
      metadata: {
        type: "merchant_support",
        merchantId,
      },
    });
  }

  async listGroupMessages(merchantId: string): Promise<GroupMessage[]> {
    await this.conversation;
    const conversation = await this.initMerchantGroup(merchantId);
    const messages = await conversation.messages();

    return messages.map((msg: DecodedMessage) => ({
      id: msg.id,
      senderAddress: msg.senderAddress,
      content: msg.content,
      sent: msg.sent,
    }));
  }

  async sendGroupMessage(merchantId: string, content: string): Promise<void> {
    await this.conversation;
    const conversation = await this.initMerchantGroup(merchantId);
    await conversation.send(content);
  }

  async streamGroupMessages(merchantId: string, callback: (msg: GroupMessage) => void) {
    await this.conversation;
    const conversation = await this.initMerchantGroup(merchantId);

    // Stream new messages
    for await (const msg of await conversation.streamMessages()) {
      callback({
        id: msg.id,
        senderAddress: msg.senderAddress,
        content: msg.content,
        sent: msg.sent,
      });
    }
  }

  disconnect() {
    if (this.client) {
      const address = this.account.getAddress();
      XMTPService.clients.delete(address);
      this.client = null;
    }
  }
}
