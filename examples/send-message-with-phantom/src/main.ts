import { GetAccountFromProvider, SOLAccount } from "../../../src/accounts/solana";
import { ItemType } from "../../../src/messages/message";
import { Publish } from "../../../src/messages/post";
import { DEFAULT_API_V2 } from "../../../src/global";
import { getPhantom } from "./getPhantom";

import { Buffer } from "buffer";
globalThis.Buffer = Buffer;

let account: SOLAccount;
const connectButton = document.getElementById("connect-phantom");
const sendMessage = document.getElementById("send-message");

connectButton?.addEventListener("click", async (e) => {
    try {
        account = await GetAccountFromProvider(getPhantom());

        if (connectButton) connectButton.style.display = "none";
        if (sendMessage) sendMessage.style.display = "block";
    } catch (err) {
        console.log(err);
        alert("An error has occured, check the console!");
    }
});

document.getElementById("send-message")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const message: HTMLInputElement | null = document.querySelector("input#message-value");
    if (!message || !message.value || message.value.length === 0) return;

    const p = document.createElement("p");
    p.innerHTML = "<strong>Posting your message ...</strong> (this could take a few seconds)";
    sendMessage?.appendChild(p);

    const published = await Publish({
        APIServer: DEFAULT_API_V2,
        channel: "Typescript-SDK-PhantomDEMO",
        inlineRequested: true,
        storageEngine: ItemType.ipfs,
        account,
        postType: "Phantom-Demo",
        content: message.value,
    });

    p.innerHTML = `Your message was sucessfully posted:<br /> 
    <a href="${DEFAULT_API_V2}/api/v0/messages.json?hashes=${published.item_hash}" target="_blank">Check on explorer</a>`;
});
