import "@ethersproject/shims";
import { ethers } from "ethers";
const erc721 = require("./erc-721");
import { BigNumber } from "ethers";

async function getResponse(): Promise<BigNumber> {
  // const { proof } = await request.json();
  // const ETH_URL = "https://polygon-rpc.com/";
  const ETH_URL = "https://webhook.site/0a626d13-81e3-43f8-be7f-56cf69c1992c";
  // const ETH_URL =
  //   "https://mainnet.infura.io/v3/6459dec09c9b4730a4cd6a9dc6d364d4";
  const NFT_CONTRACT_ADDRESS = "0x69c53e7b8c41bf436ef5a2d81db759dc8bd83b5f";
  const SIGN_STRING = "I have the NFT! Give me access.";

  // const provider = ethers.getDefaultProvider(ETH_URL);
  const provider = new ethers.providers.StaticJsonRpcProvider(
    {
      url: ETH_URL,
      headers: {
        "user-agent": "livepeer/gate",
      },
    },
    137
  );
  // await provider.ready;

  const openseaContract = new ethers.Contract(
    NFT_CONTRACT_ADDRESS,
    erc721,
    provider
  );

  const proof =
    "0xcf3708006566be50200fb4257f97e36f1fe3ad2c34a2c03d6395aa71b81ed8186af1432d1aa4e43284dfb2bf1e3b0f0b063ad461172f116685b8e842953cb2b71b";
  const address = ethers.utils.verifyMessage(SIGN_STRING, proof);
  console.log(address);
  return await openseaContract.balanceOf(address);
}

async function handleRequest(request: Request): Promise<Response> {
  try {
    const balance = await getResponse();
    if (balance.gt(0)) {
      return new Response("ok", { status: 200 });
    } else {
      return new Response("get more NFTs, nerd", { status: 403 });
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
  getResponse()
    .then((x) => console.log(x.toNumber()))
    .catch((...x) => console.log(x));
}
