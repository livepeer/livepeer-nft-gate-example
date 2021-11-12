// Address of ERC-1155 Contract
const NFT_CONTRACT_ADDRESS = "0x495f947276749ce646f68ac8c248420045cb7b5e";

// Token ID required to view the livestream
const TOKEN_ID =
  "51017201718163155258311551786469784432970066566193323465396407006035202539521";

const ETH_URL = "https://mainnet.infura.io/v3/6459dec09c9b4730a4cd6a9dc6d364d4";

const ethers = require("ethers");
const abi = require("./erc-1155.json");

const provider = ethers.getDefaultProvider(ETH_URL);

const openseaContract = new ethers.Contract(
  NFT_CONTRACT_ADDRESS,
  abi,
  provider
);

(async () => {
  const owner = await openseaContract.balanceOf(
    "0x70CAb68009e9545f8bebcD20469b8d3bAab5DB8F",
    TOKEN_ID
  );
  console.log(owner.toNumber());
})().catch((err) => console.error(err));
