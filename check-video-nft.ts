import "isomorphic-fetch";
import { ethers, BigNumber } from "ethers";
import * as standards from "./standards";
import fs from "fs";

const frontend = fs.readFileSync(__dirname + "/dist/index.html", "utf8");

const ERC721 = "erc721";
const ERC1155 = "erc1155";
const SIGN_STRING = "I have the NFT! Give me access.";

const chainList = require("./chains");
type Chains = {
  [key: string]: any;
};
const chains: Chains = {};
for (const chain of chainList) {
  const hex = `0x${chain.chainId.toString(16)}`;
  for (let key of [chain.shortName, chain.chainId, hex]) {
    key = `${key}`.toLowerCase();
    if (chains[key]) {
      console.error(
        `duplicate for key ${key}: ${chains[key].name} and ${chain.name}`
      );
    } else {
      chains[key] = chain;
    }
  }
}

type GateParams = {
  contract?: string;
  standard?: string;
  network?: string;
  message?: string;
  proof?: string;
};
async function getResponse({
  contract,
  standard = ERC721,
  network = "eth",
  message = SIGN_STRING,
  proof,
}: GateParams): Promise<BigNumber> {
  if (!contract) {
    throw new Error("missing contract");
  }
  if (!proof) {
    throw new Error("Missing proof");
  }
  const chain = chains[network.toLowerCase()];
  if (!chain) {
    throw new Error(`network ${network} not found`);
  }
  let rpc;
  for (const url of chain.rpc) {
    if (!url.startsWith("https://")) {
      continue;
    }

    // Skip URLs that require interpolation (API Keys)
    if (url.includes("${")) {
      continue;
    }

    rpc = url;
    break;
  }
  if (!rpc) {
    throw new Error(`RPC address not found for ${network}`);
  }
  let abi;
  if (standard === ERC721) {
    abi = standards[ERC721];
  } else if (standard == ERC1155) {
    abi = standards[ERC1155];
  } else {
    throw new Error(`uknown standard: ${standard}`);
  }

  // const provider = ethers.getDefaultProvider(ETH_URL);
  const provider = new ethers.providers.StaticJsonRpcProvider(
    {
      url: rpc,
      skipFetchSetup: true,
      headers: {
        "user-agent": "livepeer/gate",
      },
    },
    chain.chainId
  );

  const contractObj = new ethers.Contract(contract, abi, provider);

  const address = ethers.utils.verifyMessage(message, proof);
  return await contractObj.balanceOf(address);
}

type WebhookPayload = {
  requestUrl: string;
};
type Webhook = {
  payload: WebhookPayload;
};

async function handleRequest(request: Request): Promise<Response> {
  if (request.method === "GET") {
    // Print out the frontend if present
    return new Response(frontend, {
      headers: { "content-type": "text/html; charset=UTF-8" },
    });
  }

  const gateParams: GateParams = {};
  // Extract parameters from query params
  const { searchParams } = new URL(request.url);
  for (const [key, value] of searchParams) {
    gateParams[key] = value;
  }

  // Extract proof from webhook body
  const data = (await request.json()) as Webhook;
  const requestUrl: string = data?.payload?.requestUrl;
  if (!requestUrl) {
    return new Response("payload.url not found", { status: 413 });
  }
  const payloadUrl = new URL(requestUrl);
  const proof = payloadUrl.searchParams.get("proof");
  if (!proof) {
    return new Response("`proof` query parameter missing from payload url");
  }
  gateParams.proof = proof;

  try {
    const balance = await getResponse(gateParams);
    if (balance.gt(0)) {
      return new Response("ok", { status: 200 });
    } else {
      return new Response(`Not enough NFTs.`, {
        status: 403,
      });
    }
  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
}

if (typeof addEventListener === "function") {
  addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event.request as Request));
  });
} else if (typeof module === "object" && !module.parent) {
  getResponse({
    standard: "erc721",
    contract: "0x69c53e7b8c41bf436ef5a2d81db759dc8bd83b5f",
    network: "matic",
    proof:
      "0xcf3708006566be50200fb4257f97e36f1fe3ad2c34a2c03d6395aa71b81ed8186af1432d1aa4e43284dfb2bf1e3b0f0b063ad461172f116685b8e842953cb2b71b",
  })
    .then((x) => console.log(x.toNumber()))
    .catch((...x) => console.log(x));
}
