import { Account } from "../../accounts/account";
import {
    ItemType,
    MessageType,
    InstanceMessage,
    MachineVolume,
    HostRequirements,
    FunctionEnvironment,
    MachineResources,
    VolumePersistence,
    InstanceContent,
    Payment,
    PaymentType,
    Chain,
    MachineType,
} from "../types";
import { PutContentToStorageEngine } from "../create/publish";
import { SignAndBroadcast } from "../create/signature";
import { DEFAULT_API_V2 } from "../../global";
import { MessageBuilder } from "../../utils/messageBuilder";
import { defaultExecutionEnvironment, defaultResources } from "../constants";

export type InstancePublishConfiguration = {
    account: Account;
    channel: string;
    metadata?: Record<string, unknown>;
    variables?: Record<string, string>;
    authorized_keys?: string[];
    resources?: Partial<MachineResources>;
    requirements?: HostRequirements;
    environment?: Partial<FunctionEnvironment>;
    image?: string;
    volumes?: MachineVolume[];
    inlineRequested?: boolean;
    storageEngine?: ItemType.ipfs | ItemType.storage;
    APIServer?: string;
    payment?: Payment;
};

// TODO: Check that program_ref, runtime and data_ref exist
// Guard some numbers values
export async function publish({
    account,
    channel,
    metadata,
    variables,
    authorized_keys,
    resources,
    requirements,
    environment,
    image = "549ec451d9b099cad112d4aaa2c00ac40fb6729a92ff252ff22eef0b5c3cb613",
    volumes = [],
    inlineRequested = true,
    storageEngine = ItemType.ipfs,
    APIServer = DEFAULT_API_V2,
    payment = {
        chain: Chain.ETH,
        type: PaymentType.hold,
    },
}: InstancePublishConfiguration): Promise<InstanceMessage> {
    const timestamp = Date.now() / 1000;
    const { address } = account;

    const mergedResources = {
        ...defaultResources,
        ...resources,
    };

    const mergedEnvironment = {
        ...defaultExecutionEnvironment,
        ...environment,
    };

    const rootfs = {
        parent: {
            ref: image,
            use_latest: true,
        },
        persistence: VolumePersistence.host,
        size_mib: mergedResources.memory * 10,
    };

    const instanceContent: InstanceContent = {
        type: MachineType.vm_instance,
        address,
        time: timestamp,
        metadata,
        authorized_keys,
        volumes,
        variables,
        requirements,
        allow_amend: false,
        resources: mergedResources,
        environment: mergedEnvironment,
        rootfs,
        payment,
    };

    const message = MessageBuilder<InstanceContent, MessageType.instance>({
        account,
        channel,
        timestamp,
        storageEngine,
        content: instanceContent,
        type: MessageType.instance,
    });

    await PutContentToStorageEngine({
        message: message,
        content: instanceContent,
        inline: inlineRequested,
        APIServer,
    });

    await SignAndBroadcast({
        message: message,
        account,
        APIServer,
    });

    return message as unknown as InstanceMessage;
}
