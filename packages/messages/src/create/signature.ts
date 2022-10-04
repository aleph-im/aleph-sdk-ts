import { BaseMessage } from "@aleph-sdk-ts/core-base/dist/types/messages";
import { Account } from "@aleph-sdk-ts/core-base/dist/types/account";
import axios from "axios";
import { utils } from "@aleph-sdk-ts/core-base";

type SignAndBroadcastConfiguration = {
    message: BaseMessage;
    account: Account;
    APIServer: string;
};

type BroadcastConfiguration = SignAndBroadcastConfiguration;

export async function SignAndBroadcast(configuration: SignAndBroadcastConfiguration): Promise<void> {
    configuration.message.signature = await configuration.account.Sign(configuration.message);
    await Broadcast(configuration);
}

async function Broadcast(configuration: BroadcastConfiguration) {
    try {
        await axios.post(
            `${utils.url.stripTrailingSlash(configuration.APIServer)}/api/v0/ipfs/pubsub/pub`,
            {
                topic: "ALEPH-TEST",
                data: JSON.stringify(configuration.message),
            },
            {
                socketPath: utils.url.getSocketPath(),
            },
        );
    } catch (err) {
        console.warn(err);
    }
}
