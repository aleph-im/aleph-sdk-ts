import { Account } from "../../accounts/account";
import {
    ItemType,
    MessageType,
    ProgramMessage,
    StoreMessage,
    MachineVolume,
    Encoding,
    FunctionTriggers,
    MachineType,
    ProgramContent,
    Payment,
    PaymentType,
    Chain,
} from "../types";
import { Publish as storePublish } from "../../messages/store/index";
import { PutContentToStorageEngine } from "../create/publish";
import { SignAndBroadcast } from "../create/signature";
import { DEFAULT_API_V2 } from "../../global";
import { MessageBuilder } from "../../utils/messageBuilder";
import { RequireOnlyOne } from "../../utils/requiredOnlyOne";
import { GetMessage } from "../any";

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
 * programRef:      The hahs of a Store message containing the code you want to use
 *
 * encoding:        Encoding system used by the codebase: plain/squashfs/zip
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
type ProgramPublishConfiguration = {
    account: Account;
    channel: string;
    isPersistent?: boolean;
    storageEngine?: ItemType.ipfs | ItemType.storage;
    inlineRequested?: boolean;
    APIServer?: string;
    file?: Buffer | Blob;
    programRef?: string;
    encoding?: Encoding;
    entrypoint: string;
    subscription?: Record<string, unknown>[];
    memory?: number;
    vcpus?: number;
    runtime?: string;
    volumes?: MachineVolume[];
    metadata?: Record<string, unknown>;
    variables?: Record<string, string>;
    payment?: Payment;
};

// TODO: Check that program_ref, runtime and data_ref exist
// Guard some numbers values
export async function publish({
    account,
    channel,
    metadata,
    isPersistent = false,
    inlineRequested = true,
    storageEngine = ItemType.ipfs,
    APIServer = DEFAULT_API_V2,
    file,
    programRef,
    encoding = Encoding.zip,
    entrypoint,
    subscription,
    memory = 128,
    vcpus = 1,
    runtime = "bd79839bf96e595a06da5ac0b6ba51dea6f7e2591bb913deccded04d831d29f4",
    volumes = [],
    variables = {},
    payment = {
        chain: Chain.ETH,
        type: PaymentType.hold,
    },
}: RequireOnlyOne<ProgramPublishConfiguration, "programRef" | "file">): Promise<ProgramMessage> {
    const timestamp = Date.now() / 1000;
    if (!programRef && !file) throw new Error("You need to specify a file to upload or a programRef to load.");
    if (programRef && file) throw new Error("You can't load a file and a programRef at the same time.");

    // Store the source code of the program and retrieve the hash.
    if (!programRef && file) {
        programRef = (
            await storePublish({
                channel,
                APIServer,
                account,
                storageEngine,
                fileObject: file,
            })
        ).item_hash;
    } else if (programRef && !file) {
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
    }

    let triggers: FunctionTriggers = { http: true, persistent: isPersistent };
    if (subscription) triggers = { ...triggers, message: subscription };

    const programContent: ProgramContent = {
        address: account.address,
        time: timestamp,
        type: MachineType.vm_function,
        allow_amend: false,
        code: {
            encoding, // retrieve the file format or params
            entrypoint: entrypoint,
            ref: programRef as string,
            use_latest: true,
        },
        metadata,
        on: triggers,
        environment: {
            reproducible: false,
            internet: true,
            aleph_api: true,
            shared_cache: false,
        },
        resources: {
            vcpus,
            memory,
            seconds: 30,
        },
        runtime: {
            ref: runtime,
            use_latest: true,
            comment: "Aleph Alpine Linux with Python 3.8",
        },
        volumes,
        variables,
        payment,
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
