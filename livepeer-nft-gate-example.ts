import { Request, Response, NextFunction } from "express";
import express from "express";
import { json } from "body-parser";
import httpProxy from "http-proxy";
const ethers = require("ethers");
const abi = require("./erc-1155.json");

// Address of ERC-1155 Contract
const NFT_CONTRACT_ADDRESS = "0x495f947276749ce646f68ac8c248420045cb7b5e";

// Token ID required to view the livestream
const TOKEN_ID =
  "51017201718163155258311551786469784432970066566193323465396407006035202539521";

// String to be signed
const SIGN_STRING = "I have the NFT! Give me access.";

// Ethereum HTTP-RPC URL
const ETH_URL = "https://mainnet.infura.io/v3/6459dec09c9b4730a4cd6a9dc6d364d4";

// Livepeer.com livestream bnehind the gate
const LIVEPEER_URL = "https://cdn.livepeer.com/hls/cfd2ze0zfwi4c4lu";

const provider = ethers.getDefaultProvider(ETH_URL);

const openseaContract = new ethers.Contract(
  NFT_CONTRACT_ADDRESS,
  abi,
  provider
);

const app = express();
const proxy = httpProxy.createServer({
  target: LIVEPEER_URL,
  changeOrigin: true,
  ignorePath: true,
});

app.use(json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Method", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/info", (req: Request, res: Response) => {
  res.json({
    contractAddress: NFT_CONTRACT_ADDRESS,
    tokenId: TOKEN_ID,
    signString: SIGN_STRING,
  });
});

app.post("/check", async (req, res) => {
  try {
    console.log(req.body);
    const { signature } = req.body;
    const address = ethers.utils.verifyMessage(SIGN_STRING, signature);
    const balance = await openseaContract.balanceOf(address, TOKEN_ID);
    if (balance.toNumber() < 1) {
      res.status(403);
      return res.json({ error: "You don't have this NFT." });
    }
    res.json({ info: `Welcome, ${address}.` });
  } catch (e: any) {
    console.error(e);
    res.status(500);
    res.json({ error: e.stack });
  }
});

app.get("/hls/*", (req, res) => {
  const params = req.params as any;
  const target = `${LIVEPEER_URL}/${params[0]}`;
  console.log(`routing ${req.url} --> ${target}`);
  proxy.web(req, res, {
    target: `${LIVEPEER_URL}/${params[0]}`,
  });
});

app.listen(process.env.PORT ?? 3001);
