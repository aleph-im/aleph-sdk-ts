import { logo, separator } from "./src/logo";
import { getNodeList, getRandomNode, yesNo } from "./src/helpers";

const main = async () => {
    console.log(logo);
    console.log(separator);
    console.log("This tool allows you to easily stake on a random Node, using an Ethereum account");

    console.log("Loading nodelist...");
    const nodeList = await getNodeList();

    let nodeChosen = false;
    let nodeProposal;
    while (!nodeChosen) {
        nodeProposal = getRandomNode(nodeList);

        console.log(separator);
        console.log(`Would you like to stake on "${nodeProposal.name}" ?`);
        console.log(`It already has ${nodeProposal.total_staked.toFixed(2)} Aleph staked`);
        nodeChosen = await yesNo();
    }

    console.log();
    console.log("In order to continue you will need to authenticate using:");
    console.log("1. A Ledger device");
    console.log("2. A mnemonic");
};

main();
