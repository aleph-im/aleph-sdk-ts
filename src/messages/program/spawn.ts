import { Account } from "../../accounts/account";
import { ItemType, MessageType, ProgramMessage, StoreMessage } from "../message";
import { Encoding, FunctionTriggers, MachineType, MachineVolume, ProgramContent } from "./programModel";
import { PutContentToStorageEngine } from "../create/publish";
import { SignAndBroadcast } from "../create/signature";
import { DEFAULT_API_V2 } from "../../global";
import { MessageBuilder } from "../../utils/messageBuilder";
import { GetMessage } from "../search";

/**
 * account:         The account used to sign the aggregate message.
 *
 * channel:         The channel in which the message will be published.
 *
 * storageEngine:   The storage engine to used when storing the message in case of Max_size (IPFS or Aleph storage).
 *
 * inlineRequested: If set to False, the Program message will be store on the same storageEngine you picked.
 *
 * APIServer:       The API server endpoint used to carry the request to the Aleph's network.
 *
 * file:            The source code of the program in under Zip format.
 *
 * entrypoint:      The entrypoint of your program.
 *
 * Subscription:    How to start you program? default by Http.
 *
 * memory:          Memory amount.
 *
 * runtime:         The docker image to use for the program.
 *
 * volumes:         mount point to use for storage.
 */
type ProgramSpawnConfiguration = {
    account: Account;
    channel: string;
    storageEngine?: ItemType.ipfs | ItemType.storage;
    inlineRequested?: boolean;
    APIServer?: string;
    programRef: string;
    entrypoint: string;
    encoding?: Encoding;
    subscription?: Record<string, unknown>[];
    memory?: number;
    runtime?: string;
    volumes?: MachineVolume[];
};

export async function spawn({
    account,
    channel,
    inlineRequested = true,
    storageEngine = ItemType.ipfs,
    APIServer = DEFAULT_API_V2,
    programRef,
    entrypoint,
    encoding = Encoding.zip,
    subscription,
    memory = 128,
    runtime = "bd79839bf96e595a06da5ac0b6ba51dea6f7e2591bb913deccded04d831d29f4",
    volumes = [],
}: ProgramSpawnConfiguration): Promise<ProgramMessage> {
    const timestamp = Date.now() / 1000;

    try {
        const fetchCode = await GetMessage<StoreMessage>({
            hash: programRef,
            APIServer: DEFAULT_API_V2,
        });
        if (fetchCode.sender != account.address)
            console.warn(
                "Caution, you are not the owner of the code. Be aware that the codebase can be changed at any time by the owner.",
            );
    } catch (e) {
        throw new Error(`The program ref: ${programRef} does not exist on Aleph network.`);
    }

    let triggers: FunctionTriggers = { http: true };
    if (subscription) triggers = { ...triggers, message: subscription };

    const programContent: ProgramContent = {
        address: account.address,
        time: timestamp,
        type: MachineType.vm_function,
        allow_amend: false,
        code: {
            encoding,
            entrypoint: entrypoint,
            ref: programRef,
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
        inline: inlineRequested,
        APIServer,
    });

    await SignAndBroadcast({
        message: message,
        account,
        APIServer,
    });

    return message;
}
