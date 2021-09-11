import {BaseMessage} from "../message";
import {Account} from "../../accounts/account";
import axios from "axios";

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
    await axios.post(
        `${configuration.APIServer}/api/v0/ipfs/pubsub/pub`,
        {
            topic: 'ALEPH-TEST',
            data: JSON.stringify(configuration.message),
        },
    );
}
