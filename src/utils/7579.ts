import { createSmartAccountClient } from "permissionless";
import { erc7579Actions } from "permissionless/actions/erc7579";
import { toSafeSmartAccount } from "permissionless/accounts";
import { chain, publicClient } from "@/config/web3";
import {
  RHINESTONE_ATTESTER_ADDRESS,
  WEBAUTHN_VALIDATOR_ADDRESS,
  getAccount,
  encodeValidatorNonce,
  getWebAuthnValidator,
  getWebauthnValidatorMockSignature,
  getWebauthnValidatorSignature,
  Execution,
  getOwnableExecutor,
  getExecuteBatchOnOwnedAccountAction,
  getOwnableExecutorOwners,
} from "@rhinestone/module-sdk";
import { createWebAuthnCredential, entryPoint07Address, getUserOperationHash } from "viem/account-abstraction";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { getAccountNonce } from "permissionless/actions";
import { sign } from "ox/WebAuthnP256";
import { PublicKey } from "ox";
import { http, parseEther } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const API_KEY = "pim_Ws2qtNWqWEyQ7xb5FpoPAK";

const pimlicoClient = createPimlicoClient({
  transport: http(`https://api.pimlico.io/v2/${chain.id}/rpc?apikey=${API_KEY}`),
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

  const individualAccountClient = createSmartAccountClient({
    account: individualAccount,
    chain,
    bundlerTransport: http(`https://api.pimlico.io/v2/${chain.id}/rpc?apikey=${API_KEY}`),
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
      to: individualAccountClient.account.address,
      target: individualAccountClient.account.address,
      value: parseEther("0"),
      data: "0x",
      callData: "0x",
    },
  ];

  // First nonce for individual account deployment
  const individualNonce = await getAccountNonce(publicClient, {
    address: individualAccountClient.account.address,
    entryPointAddress: entryPoint07Address,
    key: encodeValidatorNonce({
      account: getAccount({
        address: individualAccountClient.account.address,
        type: "safe",
      }),
      validator: WEBAUTHN_VALIDATOR_ADDRESS,
    }),
  });

  const userOperation = await individualAccountClient.prepareUserOperation({
    account: individualAccountClient.account,
    calls,
    nonce: individualNonce,
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

  const userOpHash = await individualAccountClient.sendUserOperation(userOperation);
  const userOpReceipt = await individualAccountClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  console.log("User operation receipt:", userOpReceipt);

  // Create the ownable executor module first
  const ownableModule = getOwnableExecutor({
    owner: individualAccountClient.account.address,
  });

  const settlementAccount = await toSafeSmartAccount({
    client: publicClient,
    owners: [individualAccountClient.account],
    version: "1.4.1",
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
    safe4337ModuleAddress: "0x7579EE8307284F293B1927136486880611F20002",
    erc7579LaunchpadAddress: "0x7579011aB74c46090561ea277Ba79D510c6C00ff",
    attesters: [RHINESTONE_ATTESTER_ADDRESS],
    attestersThreshold: 1,
  });

  // Create deployment call for Settlement Account
  const settlementDeploymentCall: Execution = {
    to: settlementAccount.address,
    target: settlementAccount.address,
    value: parseEther("0"),
    data: "0x",
    callData: "0x",
  };

  // Create the action to be executed through the individual account
  const executeOnSettlementAction = getExecuteBatchOnOwnedAccountAction({
    ownedAccount: settlementAccount.address,
    executions: [settlementDeploymentCall],
  });

  // Second nonce for settlement account action
  const individualNonce2 = await getAccountNonce(publicClient, {
    address: individualAccountClient.account.address,
    entryPointAddress: entryPoint07Address,
    key: encodeValidatorNonce({
      account: getAccount({
        address: individualAccountClient.account.address,
        type: "safe",
      }),
      validator: WEBAUTHN_VALIDATOR_ADDRESS,
    }),
  });

  console.log("Individual account address:", individualAccountClient.account.address);
  console.log("Settlement account address:", settlementAccount.address);
  console.log("Ownable executor module address:", ownableModule.address);

  const userOperation2 = await individualAccountClient.prepareUserOperation({
    account: individualAccountClient.account,
    calls: [executeOnSettlementAction],
    nonce: individualNonce2,
    signature: getWebauthnValidatorMockSignature(),
  });

  const userOpHashToSign2 = getUserOperationHash({
    chainId: chain.id,
    entryPointAddress: entryPoint07Address,
    entryPointVersion: "0.7",
    userOperation: userOperation2,
  });

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

  const userOpHash2 = await individualAccountClient.sendUserOperation(userOperation2);
  const userOpReceipt2 = await individualAccountClient.waitForUserOperationReceipt({
    hash: userOpHash2,
  });

  console.log("Settlement deployment receipt:", userOpReceipt2);
}
