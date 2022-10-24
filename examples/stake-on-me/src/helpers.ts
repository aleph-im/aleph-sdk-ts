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

export const yesNo = (): Promise<boolean> => {
    return new Promise((resolve) => {
        rl.question("[y]es/no: ", (answer) => {
            if (answer === "yes" || answer === "y") {
                return resolve(true);
            }

            return resolve(false);
        });
    });
};
