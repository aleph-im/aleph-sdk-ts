import { logo, separator } from "./src/logo";
import { askChoices, getNodeList, getRandomNode, keypress } from "./src/helpers";
import { GetAccountFromLedger } from "../../src/accounts/providers/Ledger/ethereum";
import { ItemType } from "../../src/messages/types";
import * as post from "../../src/messages/post";

const main = async () => {
    console.log(logo);
    console.log(separator);
    console.log("This tool allows you to easily stake on a random node, using an Ethereum account");
    console.log("It will first fetch the list of stakeable nodes, then give you some suggestion");
    console.log();
    console.log("Press any key to continue");
    await keypress();

    console.log("Loading nodelist...");
    const nodeList = await getNodeList();

    let nodeChosen = false;
    let nodeProposal;
    while (!nodeChosen) {
        nodeProposal = getRandomNode(nodeList);

        console.log(separator);
        console.log(`Would you like to stake on "${nodeProposal.name}" ?`);
        console.log(`It already has ${nodeProposal.total_staked.toFixed(2)} Aleph staked`);
        try {
            nodeChosen = (await askChoices([
                ["yes", true],
                ["no", false],
            ])) as boolean;
        } catch (error) {
            console.log(error);
            process.exit(1);
        }
    }

    console.log();
    console.log("In order to continue you will need to authenticate using a Ledger device");
    console.log("Your Ledger device needs to be plugged in, unlocked with the Ethereum app open");
    console.log("Press a key once it is ready (or ctrl + c to exit)");
    await keypress();

    const account = await GetAccountFromLedger();
    console.log(`Ledger device found, using address: ${account.address}`);
    console.log(separator);
    console.log("Sending a stake message on selected Node. Please check your Ledger to sign the message.");

    const stakeMessage = await post.Publish({
        account,
        APIServer: "https://api2.aleph.im",
        channel: "FOUNDATION",
        storageEngine: ItemType.inline,
        postType: "corechan-operation",
        content: {
            tags: ["stake-split", "mainnet"],
            action: "stake-split",
        },
        ref: nodeProposal.hash,
    });

    console.log("Your request was succesfully posted, enjoy your fresh rewards! :)");
    console.log(`https://explorer.aleph.im/address/ETH/${account.address}/message/POST/${stakeMessage.item_hash}`);
    process.exit();
};

main();
