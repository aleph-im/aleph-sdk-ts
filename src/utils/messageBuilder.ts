import { ItemType } from "../messages/message";
import { Account } from "../accounts/account";

type MessageBuilderConfig<T, C> = {
    storageEngine: ItemType;
    account: Account;
    channel: string;
    timestamp: number;
    content: T;
    type: C;
};

export function MessageBuilder<T, C>(config: MessageBuilderConfig<T, C>) {
    return {
        type: config.type,
        time: config.timestamp,
        channel: config.channel,
        content: config.content,
        item_type: config.storageEngine,
        sender: config.account.address,
        chain: config.account.GetChain(),
        size: 0,
        item_hash: "",
        signature: "",
        item_content: "",
        confirmed: false,
    };
}
