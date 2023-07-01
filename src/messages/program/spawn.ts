import { Account } from "../../accounts/account";
import { ItemType, ProgramMessage, MachineVolume } from "../types";
import { Encoding } from "./programModel";
import { DEFAULT_API_V2 } from "../../global";
import { publish } from "./publish";

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
    isPersistent?: boolean;
    storageEngine?: ItemType.ipfs | ItemType.storage;
    inlineRequested?: boolean;
    APIServer?: string;
    programRef: string;
    entrypoint: string;
    encoding?: Encoding;
    subscription?: Record<string, unknown>[];
    memory?: number;
    vcpus?: number;
    runtime?: string;
    volumes?: MachineVolume[];
    metadata?: Record<string, unknown>;
    variables?: Record<string, string>;
};

export async function Spawn({
    account,
    channel,
    metadata,
    isPersistent = false,
    inlineRequested = true,
    storageEngine = ItemType.ipfs,
    APIServer = DEFAULT_API_V2,
    programRef,
    entrypoint,
    encoding = Encoding.zip,
    subscription,
    memory = 128,
    vcpus = 1,
    runtime = "bd79839bf96e595a06da5ac0b6ba51dea6f7e2591bb913deccded04d831d29f4",
    volumes = [],
    variables = {},
}: ProgramSpawnConfiguration): Promise<ProgramMessage> {
    return await publish({
        account,
        channel,
        metadata,
        isPersistent,
        inlineRequested,
        storageEngine,
        APIServer,
        programRef,
        entrypoint,
        encoding,
        subscription,
        memory,
        vcpus,
        runtime,
        volumes,
        variables,
    });
}
