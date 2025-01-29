import { createSmartAccountClient, SmartAccountClient } from "permissionless";
import { erc7579Actions } from "permissionless/actions/erc7579";
import { toSafeSmartAccount, toSimpleSmartAccount } from "permissionless/accounts";
import { BUNDLER_URL, chain, publicClient } from "@/config/web3";
import {
  RHINESTONE_ATTESTER_ADDRESS,
  MOCK_ATTESTER_ADDRESS,
  WEBAUTHN_VALIDATOR_ADDRESS,
  getAccount,
  encodeValidatorNonce,
  getOwnableValidator,
  OWNABLE_VALIDATOR_ADDRESS,
  getWebAuthnValidator,
  getWebauthnValidatorMockSignature,
  getWebauthnValidatorSignature,
  getAddOwnableValidatorOwnerAction,
  getOwnableValidatorOwners,
  getClient,
  Execution,
  SENTINEL_ADDRESS,
  getOwnableExecutor,
  getRemoveOwnableExecutorOwnerAction,
  getAddOwnableExecutorOwnerAction,
  getOwnableValidatorSignature,
  getOwnableValidatorMockSignature,
} from "@rhinestone/module-sdk";
import {
  createPaymasterClient,
  createWebAuthnCredential,
  entryPoint07Abi,
  entryPoint07Address,
  getUserOperationHash,
  toWebAuthnAccount,
} from "viem/account-abstraction";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { getAccountNonce } from "permissionless/actions";
import { sign } from "ox/WebAuthnP256";
import { PublicKey } from "ox";
import {
  Address,
  createTransport,
  encodeFunctionData,
  Hex,
  http,
  keccak256,
  pad,
  parseAbi,
  parseEther,
  slice,
  sliceHex,
  zeroAddress,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { WebAuthnSafeAccountHelper } from "./safeAccount";

const pimlicoClient = createPimlicoClient({
  transport: http(`https://api.pimlico.io/v2/${chain.id}/rpc?apikey=pim_Ws2qtNWqWEyQ7xb5FpoPAK`),
  entryPoint: {
    address: entryPoint07Address,
    version: "0.7",
  },
});

export default async function create7579Account() {
  const credential = await createWebAuthnCredential({
    name: "Wallet Owner",
  });

  const temporaryOwner = privateKeyToAccount(generatePrivateKey());

  const { x, y, prefix } = PublicKey.from(credential.publicKey);
  const webauthnModule = getWebAuthnValidator({
    pubKey: { x, y, prefix },
    authenticatorId: credential.id,
  });

  const settlementAccount = await toSafeSmartAccount({
    client: publicClient,
    owners: [temporaryOwner],
    version: "1.4.1",
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
    safe4337ModuleAddress: "0x7579EE8307284F293B1927136486880611F20002",
    erc7579LaunchpadAddress: "0x7579011aB74c46090561ea277Ba79D510c6C00ff",
    attesters: [
      RHINESTONE_ATTESTER_ADDRESS, // Rhinestone Attester
    ],
    attestersThreshold: 1,
    validators: [
      {
        address: webauthnModule.address,
        context: webauthnModule.initData,
      },
    ],
  });

  const settlementAccountClient = createSmartAccountClient({
    account: settlementAccount,
    chain,
    bundlerTransport: http(`https://api.pimlico.io/v2/${chain.id}/rpc?apikey=pim_Ws2qtNWqWEyQ7xb5FpoPAK`),
    paymaster: pimlicoClient,
    userOperation: {
      estimateFeesPerGas: async () => {
        return (await pimlicoClient.getUserOperationGasPrice()).fast;
      },
    },
  }).extend(erc7579Actions());

  // Batch remove EOA owner and replace with zero address
  // const swapOwnerData = encodeFunctionData({
  //   functionName: "swapOwner",
  //   abi: parseAbi(["function swapOwner(address,address,address)"]),
  //   args: [SENTINEL_ADDRESS, temporaryOwner.address, zeroAddress],
  // });

  const calls: Execution[] = [
    {
      to: settlementAccountClient.account.address,
      target: settlementAccountClient.account.address,
      value: parseEther("0"),
      data: "0x",
      callData: "0x",
    },
  ];

  const nonce = await getAccountNonce(publicClient, {
    address: settlementAccountClient.account.address,
    entryPointAddress: entryPoint07Address,
    key: encodeValidatorNonce({
      account: getAccount({
        address: settlementAccountClient.account.address,
        type: "safe",
      }),
      validator: WEBAUTHN_VALIDATOR_ADDRESS,
    }),
  });

  const userOperation = await settlementAccountClient.prepareUserOperation({
    account: settlementAccountClient.account,
    calls,
    nonce,
    signature: getWebauthnValidatorMockSignature(),
  });

  const userOpHashToSign = getUserOperationHash({
    chainId: chain.id,
    entryPointAddress: entryPoint07Address,
    entryPointVersion: "0.7",
    userOperation,
  });

  const { metadata: webauthn, signature } = await sign({
    credentialId: credential.id,
    challenge: userOpHashToSign,
  });

  const encodedSignature = getWebauthnValidatorSignature({
    webauthn,
    signature,
    usePrecompiled: true,
  });
  userOperation.signature = encodedSignature;

  const userOpHash = await settlementAccountClient.sendUserOperation(userOperation);
  const userOpReceipt = await settlementAccountClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  console.log("User operation receipt:", userOpReceipt);

  const ownableModule = getOwnableExecutor({
    owner: settlementAccountClient.account.address,
  });

  const savingsAccount = await toSafeSmartAccount({
    client: publicClient,
    owners: [settlementAccountClient.account],
    version: "1.4.1",
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
    safe4337ModuleAddress: "0x7579EE8307284F293B1927136486880611F20002",
    erc7579LaunchpadAddress: "0x7579011aB74c46090561ea277Ba79D510c6C00ff",
    attesters: [
      RHINESTONE_ATTESTER_ADDRESS, // Rhinestone Attester
    ],
    attestersThreshold: 1,
  });

  const savingsAccountClient = createSmartAccountClient({
    account: savingsAccount,
    chain,
    bundlerTransport: http(`https://api.pimlico.io/v2/${chain.id}/rpc?apikey=pim_Ws2qtNWqWEyQ7xb5FpoPAK`),
    paymaster: pimlicoClient,
    userOperation: {
      estimateFeesPerGas: async () => {
        return (await pimlicoClient.getUserOperationGasPrice()).fast;
      },
    },
  }).extend(erc7579Actions());
}
