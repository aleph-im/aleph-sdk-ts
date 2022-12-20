import { Account } from "../../accounts/account";
import { ItemType, MessageType, ProgramMessage } from "../message";
import { Publish as storePublish } from "../../messages/store/index";
import { Encoding, FunctionTriggers, MachineType, MachineVolume, ProgramContent } from "./programModel";
import { PutContentToStorageEngine } from "../create/publish";
import { SignAndBroadcast } from "../create/signature";
import { DEFAULT_API_V2 } from "../../global";
import { MessageBuilder } from "../../utils/messageBuilder";

type ProgramPublishConfiguration = {
    account: Account;
    channel: string;
    storageEngine?: ItemType;
    inlineRequested?: boolean;
    APIServer?: string;
    file: Buffer | Blob;
    entrypoint: string;
    subscription?: Record<string, unknown>[];
    memory?: number;
    runtime?: string;
    volumes?: MachineVolume[];
};

// TODO: Check that program_ref, runtime and data_ref exist
// Guard some numbers values
export async function publish({
    account,
    channel,
    inlineRequested,
    storageEngine = ItemType.inline,
    APIServer = DEFAULT_API_V2,
    file,
    entrypoint,
    subscription,
    memory = 128,
    runtime = "bd79839bf96e595a06da5ac0b6ba51dea6f7e2591bb913deccded04d831d29f4",
    volumes = [],
}: ProgramPublishConfiguration): Promise<ProgramMessage> {
    if (inlineRequested) console.warn("Inline requested is deprecated and will be removed: use storageEngine.inline");

    const timestamp = Date.now() / 1000;
    // Store the source code of the program and retrieve the hash.
    const programRef = await storePublish({
        channel,
        APIServer,
        account,
        storageEngine: ItemType.storage,
        fileObject: file,
    });

    let triggers: FunctionTriggers = { http: true };
    if (subscription) triggers = { ...triggers, message: subscription };

    const programContent: ProgramContent = {
        address: account.address,
        time: timestamp,
        type: MachineType.vm_function,
        allow_amend: false,
        code: {
            encoding: Encoding.zip, // retrieve the file format or params
            entrypoint: entrypoint,
            ref: programRef.item_hash,
            use_latest: true,
        },
        on: triggers,
        environment: {
            reproducible: false,
            internet: true,
            aleph_api: true,
            shared_cache: false,
        },
        resources: {
            vcpus: 1,
            memory: memory,
            seconds: 30,
        },
        runtime: {
            ref: runtime,
            use_latest: true,
            comment: "Aleph Alpine Linux with Python 3.8",
        },
        volumes,
    };

    const message = MessageBuilder<ProgramContent, MessageType.program>({
        account,
        channel,
        timestamp,
        storageEngine,
        content: programContent,
        type: MessageType.program,
    });

    await PutContentToStorageEngine({
        message: message,
        content: programContent,
        APIServer,
    });

    await SignAndBroadcast({
        message: message,
        account,
        APIServer,
    });

    return message;
}
