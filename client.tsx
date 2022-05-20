import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { ethers } from "ethers";
import HLS from "hls.js";

declare let window: any;

// Hydrate the
const initialGate = {
  contract: "",
  network: "eth",
  standard: "erc721",
  message: `Hello, I hold this NFT. Please let me in.`,
};

const firstUrl = new URL(window.location.href);
for (const [key, value] of firstUrl.searchParams) {
  for (const gateKey of Object.keys(initialGate)) {
    console.log(key, gateKey);
    if (key === gateKey) {
      initialGate[key] = value;
    }
  }
}

const App = () => {
  const [errorText, setErrorText] = useState("");
  const [showVideo, setShowVideo] = useState(false);
  const [proof, setProof] = useState(null);
  const [gate, setGate] = useState(initialGate);

  useEffect(() => {
    const params = new URLSearchParams(gate);
    const newUrl = new URL(window.location.href);
    newUrl.search = `?${params}`;
    window.history.replaceState(null, "", newUrl);
  }, [gate]);

  return (
    <main>
      <h3>Create a livestream only viewable by holders of a certain NFT!</h3>
      <h4>Step 1: Define Gate</h4>
      <div>
        Token Contract Address:
        <input
          value={gate.contract}
          onChange={(e) => setGate({ ...gate, contract: e.target.value })}
        ></input>
      </div>
      <div>
        Network (default eth):
        <input
          value={gate.network}
          onChange={(e) => setGate({ ...gate, network: e.target.value })}
          placeholder="eth"
        ></input>
      </div>
      <div>
        Token Standard (default erc721):
        <div
          onChange={(e) =>
            setGate({ ...gate, standard: (e.target as any).value })
          }
        >
          &nbsp;ERC-721
          <input type="radio" value="erc721" name="standard" />
          &nbsp;ERC-1155
          <input type="radio" value="erc1155" name="standard" />
        </div>
      </div>
      <div>
        Message to sign
        <input
          value={gate.message}
          onChange={(e) => setGate({ ...gate, message: e.target.value })}
          placeholder="I have the NFT! Give me access."
        ></input>
      </div>
      <button
        onClick={async () => {
          try {
            setErrorText("");
            const provider = new ethers.providers.Web3Provider(
              window.ethereum,
              "any"
            );
            // Prompt user for account connections
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const signed = await signer.signMessage(info.signString);
            setProof(signed);
          } catch (e) {
            setErrorText(e.message);
          }
        }}
      >
        Log in
      </button>
      <button
        onClick={async () => {
          setShowVideo(true);
        }}
      >
        Fake log in (for testing)
      </button>
      <h3 style={{ color: "red" }}>{errorText}</h3>
      {(showVideo || proof) && <MistPlayer proof={proof} index={proof} />}
    </main>
  );
};

const MistPlayer = ({ proof, index }) => {
  useEffect(() => {
    setTimeout(() => {
      var a = function () {
        window.mistPlay("b135bpp8yefanya8", {
          target: document.getElementById("mistvideo"),
          urlappend: `?proof=${proof}`,
          forcePlayer: "hlsjs",
          forceType: "html5/application/vnd.apple.mpegurl",
          forcePriority: {
            source: [["type", ["html5/application/vnd.apple.mpegurl"]]],
          },
        });
      };
      if (!window.mistplayers) {
        var p = document.createElement("script");
        p.src = "https://playback.livepeer.engineering/player.js";
        document.head.appendChild(p);
        p.onload = a;
      } else {
        a();
      }
    });
  }, [proof]);
  return <div index={index} class="mistvideo" id="mistvideo"></div>;
};

ReactDOM.render(<App />, document.querySelector("main"));
