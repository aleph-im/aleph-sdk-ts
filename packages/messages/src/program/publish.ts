import { Account } from "@aleph-sdk-ts/core-base/dist/types/account";
import { messageType, programType } from "@aleph-sdk-ts/core-base";
import { Publish as storePublish } from "../store";
import { PutContentToStorageEngine } from "../create/publish";
import { SignAndBroadcast } from "../create/signature";

type ProgramPublishConfiguration = {
    account: Account;
    channel: string;
    storageEngine: messageType.ItemType;
    inlineRequested: boolean;
    APIServer: string;
    file: Buffer | Blob;
    entrypoint: string;
    subscription?: Record<string, unknown>[];
    memory?: number;
    runtime?: string;
    volumes?: programType.MachineVolume[];
};

// TODO: Check that program_ref, runtime and data_ref exist
// Guard some numbers values
export async function Publish(configuration: ProgramPublishConfiguration): Promise<messageType.ProgramMessage> {
    const timestamp = Date.now() / 1000;
    const storageEngine: messageType.ItemType = messageType.ItemType.storage;

    // Store the source code of the program and retrieve the hash.
    const programRef = await storePublish({
        channel: configuration.channel,
        APIServer: configuration.APIServer,
        account: configuration.account,
        storageEngine: storageEngine,
        fileObject: configuration.file,
    });

    let triggers: programType.FunctionTriggers = { http: true };
    if (configuration.subscription) {
        triggers = { ...triggers, message: configuration.subscription };
    }

    const content: programType.ProgramContent = {
        address: configuration.account.address,
        time: timestamp,
        type: programType.MachineType.vm_function,
        allow_amend: false,
        code: {
            encoding: programType.Encoding.zip, // retrieve the file format or params
            entrypoint: configuration.entrypoint,
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
            memory: configuration.memory ? configuration.memory : 128,
            seconds: 30,
        },
        runtime: {
            ref: configuration.runtime
                ? configuration.runtime
                : "bd79839bf96e595a06da5ac0b6ba51dea6f7e2591bb913deccded04d831d29f4",
            use_latest: true,
            comment: "Aleph Alpine Linux with Python 3.8",
        },
        volumes: configuration.volumes ? configuration.volumes : [],
    };

    const message: messageType.ProgramMessage = {
        chain: configuration.account.GetChain(),
        channel: configuration.channel,
        confirmed: false,
        item_type: storageEngine,
        sender: configuration.account.address,
        signature: "",
        size: 0,
        item_content: "",
        item_hash: "",
        time: timestamp,
        type: messageType.MessageType.program,
        content: content,
    };

    await PutContentToStorageEngine({
        message: message,
        content: content,
        inlineRequested: true,
        storageEngine: storageEngine,
        APIServer: configuration.APIServer,
    });

    await SignAndBroadcast({
        message: message,
        account: configuration.account,
        APIServer: configuration.APIServer,
    });

    return message;
}
