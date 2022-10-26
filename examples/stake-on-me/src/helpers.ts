import * as readline from "readline";
import { stdin as input, stdout as output } from "process";
import * as aggregate from "../../../src/messages/aggregate";

type NodeListResponse = {
    corechannel: {
        nodes: any[];
    };
};

export const getNodeList = async () => {
    const list: NodeListResponse = await aggregate.Get({
        address: "0xa1B3bb7d2332383D96b7796B908fB7f7F3c2Be10",
        keys: ["corechannel"],
    });

    return list.corechannel.nodes.filter((node) => node.status === "active" && !node.locked);
};

export const getRandomNode = (nodeList: any[]) => {
    const seed = (Math.random() * nodeList.length) | 0;

    return nodeList[seed];
};

const rl = readline.createInterface({ input, output });

type Proposition = [string, any];

export const askChoices = (proposition: Proposition[]) => {
    const labels = proposition.map(([x]) => x);

    return new Promise((resolve, reject) => {
        rl.question(`${labels.join("/")}: `, (answer) => {
            const found = proposition.find(([label]) => label.toLowerCase() === answer);
            if (found !== undefined) resolve(found[1]);
            reject("This is not a valid option");
        });
    });
};

export const keypress = async () => {
    process.stdin.setRawMode(true);
    return new Promise((resolve) =>
        process.stdin.once("data", (data) => {
            const byteArray = [...data];
            if (byteArray.length > 0 && byteArray[0] === 3) {
                console.log("^C");
                process.exit(1);
            }
            process.stdin.setRawMode(false);
            resolve(true);
        }),
    );
};
