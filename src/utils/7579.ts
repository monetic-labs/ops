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

  const individualAccount = await toSafeSmartAccount({
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

  const individualSmartAccountClient = createSmartAccountClient({
    account: individualAccount,
    chain,
    bundlerTransport: http(`https://api.pimlico.io/v2/${chain.id}/rpc?apikey=pim_Ws2qtNWqWEyQ7xb5FpoPAK`),
    paymaster: pimlicoClient,
    userOperation: {
      estimateFeesPerGas: async () => {
        return (await pimlicoClient.getUserOperationGasPrice()).fast;
      },
    },
  }).extend(erc7579Actions());

  // const swapOwnerData = encodeFunctionData({
  //   functionName: "swapOwner",
  //   abi: parseAbi(["function swapOwner(address,address,address)"]),
  //   args: [SENTINEL_ADDRESS, temporaryOwner.address, zeroAddress],
  // });

  // Batch remove EOA owner and replace with zero address
  const calls: Execution[] = [
    {
      to: individualSmartAccountClient.account.address,
      target: individualSmartAccountClient.account.address,
      value: parseEther("0"),
      data: "0x",
      callData: "0x",
    },
  ];

  const nonce = await getAccountNonce(publicClient, {
    address: individualSmartAccountClient.account.address,
    entryPointAddress: entryPoint07Address,
    key: encodeValidatorNonce({
      account: getAccount({
        address: individualSmartAccountClient.account.address,
        type: "safe",
      }),
      validator: WEBAUTHN_VALIDATOR_ADDRESS,
    }),
  });

  const userOperation = await individualSmartAccountClient.prepareUserOperation({
    account: individualSmartAccountClient.account,
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

  const userOpHash = await individualSmartAccountClient.sendUserOperation(userOperation);
  const userOpReceipt = await individualSmartAccountClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  console.log("User operation receipt:", userOpReceipt);

  const ownableModule = getOwnableExecutor({
    owner: individualSmartAccountClient.account.address,
  });

  const settlementAccount = await toSafeSmartAccount({
    client: publicClient,
    owners: [individualSmartAccountClient.account],
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
        address: ownableModule.address,
        context: ownableModule.initData,
      },
    ],
  });

  const settlementSmartAccountClient = createSmartAccountClient({
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

  const settlementNonce = await getAccountNonce(publicClient, {
    address: settlementSmartAccountClient.account.address,
    entryPointAddress: entryPoint07Address,
    key: encodeValidatorNonce({
      account: getAccount({
        address: settlementSmartAccountClient.account.address,
        type: "safe",
      }),
      validator: ownableModule,
    }),
  });

  const calls2: Execution[] = [
    {
      to: settlementSmartAccountClient.account.address,
      target: settlementSmartAccountClient.account.address,
      value: parseEther("0"),
      data: "0x",
      callData: "0x",
    },
  ];

  const userOperation2 = await settlementSmartAccountClient.prepareUserOperation({
    account: settlementSmartAccountClient.account,
    calls: calls2,
    nonce: settlementNonce,
    signature: getOwnableValidatorMockSignature({
      threshold: 1,
    }),
  });

  // Get the hash that needs to be signed by Individual Account
  const userOpHashToSign2 = getUserOperationHash({
    chainId: chain.id,
    entryPointAddress: entryPoint07Address,
    entryPointVersion: "0.7",
    userOperation: userOperation2,
  });

  // Since Individual Account uses WebAuthn, we need to get WebAuthn signature
  const { metadata: webauthn2, signature: signature2 } = await sign({
    credentialId: credential.id,
    challenge: userOpHashToSign2,
  });

  const encodedSignature2 = getWebauthnValidatorSignature({
    webauthn: webauthn2,
    signature: signature2,
    usePrecompiled: true,
  });

  userOperation2.signature = encodedSignature2;

  const userOpHash2 = await settlementSmartAccountClient.sendUserOperation(userOperation2);
  const userOpReceipt2 = await settlementSmartAccountClient.waitForUserOperationReceipt({
    hash: userOpHash2,
  });

  console.log("Settlement transfer receipt:", userOpReceipt2);
}
