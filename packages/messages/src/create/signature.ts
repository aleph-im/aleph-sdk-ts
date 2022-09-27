import { BaseMessage } from "@aleph-sdk-ts/core-base/dist/messages";
import { Account } from "@aleph-sdk-ts/core-base/dist/account";
import axios from "axios";
import { getSocketPath, stripTrailingSlash } from "@aleph-sdk-ts/core-base/dist/utils/url";

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
            `${stripTrailingSlash(configuration.APIServer)}/api/v0/ipfs/pubsub/pub`,
            {
                topic: "ALEPH-TEST",
                data: JSON.stringify(configuration.message),
            },
            {
                socketPath: getSocketPath(),
            },
        );
    } catch (err) {
        console.warn(err);
    }
}
