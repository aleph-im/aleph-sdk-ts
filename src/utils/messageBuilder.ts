import { ItemType } from "../messages/message";
import { Account } from "../accounts/account";

type MessageBuilderConfig<C, T> = {
    storageEngine: ItemType;
    account: Account;
    channel: string;
    timestamp: number;
    content: C;
    type: T;
};

export function MessageBuilder<C, T>(config: MessageBuilderConfig<C, T>) {
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
