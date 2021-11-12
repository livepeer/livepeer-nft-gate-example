import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { ethers } from "ethers";
console.log(ethers);

const App = () => {
  const [info, setInfo] = useState(null);
  const [errorText, setErrorText] = useState("");
  useEffect(() => {
    fetch("http://localhost:3001/info")
      .then((res) => res.json())
      .then((info) => setInfo(info));
  }, []);
  if (!info) {
    return <div />;
  }
  return (
    <div>
      <h3>This livestream is only viewable by holders of a certain NFT.</h3>
      <p>
        Token ID: <code>{info.tokenId}</code>
        <br />
        Contract Address: <code>{info.contractAddress}</code> <br />
        <a
          href={`https://opensea.io/assets/${info.contractAddress}/${info.tokenId}`}
        >
          Link at OpenSea
        </a>
      </p>
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
            const res = await fetch("http://localhost:3001/check", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                signature: signed,
                address: (await signer.getAddress()).toString(),
              }),
            });
            const data = await res.json();
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            setErrorText(e.message);
          }
        }}
      >
        Log in
      </button>
      <h3 style={{ color: "red" }}>{errorText}</h3>
    </div>
  );
};

ReactDOM.render(<App />, document.querySelector("main"));
