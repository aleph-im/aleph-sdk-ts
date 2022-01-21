import { BaseContent } from "../message";

/**
 * Type of Encoding
 */
export enum Encoding {
    plain = "plain",
    zip = "zip",
    squashfs = "squashfs",
}

/**
 * Type of execution
 */
export enum MachineType {
    vm_function = "vm-function",
}

/**
 * Code to execute
 */
export type CodeContent = {
    encoding: Encoding;
    entrypoint: string;
    ref: string;
    use_latest: boolean;
};

/**
 * Data to use during computation
 */
export type DataContent = {
    encoding: Encoding;
    mount: string;
    ref: string;
    use_latest: boolean;
};

/**
 * Data to export after computation
 */
export type Export = {
    encoding: Encoding;
    mount: string;
};

/**
 * Signals that trigger an execution
 */
export type FunctionTriggers = {
    http: boolean;
    message?: Record<string, unknown>[];
};

/**
 * Properties of the execution environment
 */
export type FunctionEnvironment = {
    reproducible: boolean;
    internet: boolean;
    aleph_api: boolean;
    shared_cache: boolean;
};

/**
 * System resources required
 */
export type MachineResources = {
    vcpus: number;
    memory: number;
    seconds: number;
};

/**
 * Execution runtime (rootfs with Python interpreter)
 */
export type FunctionRuntime = {
    ref: string;
    use_latest: boolean;
    comment: string;
};

export type AbstractVolume = {
    comment?: string[];
    mount?: string[];
    is_read_only: () => boolean;
};

/**
 * Immutable volumes contain extra files that can be used by a program and are stored on the Aleph network.
 * They can be shared by multiple programs and updated independently of the code of the program.
 *
 * You can use them to store Python libraries that your program depends on,
 * use them in multiple programs and update them independently of other programs.
 */
export type ImmutableVolume = AbstractVolume & {
    ref: string;
    use_latest: boolean;
    is_read_only: () => true;
};

/**
 * Ephemeral volumes provide temporary disk storage to a VM during its execution without requiring more memory.
 */
export type EphemeralVolume = AbstractVolume & {
    ephemeral: true;
    size_mib: number; //Limit to 1 GiB
    is_read_only: () => false;
};

export enum VolumePersistence {
    host = "host",
    store = "store",
}

/**
 * Host persistent volumes are empty volumes that your program can use to store information that,
 * would be useful to persist between executions but can be recovered from other sources.
 *
 * There is no guarantee that these volumes will not be deleted anytime,
 * when the program is not running and important data must be persisted on the Aleph network.
 */
export type PersistentVolume = AbstractVolume & {
    persistence: VolumePersistence;
    name: string;
    size_mib: number; //Limit to 1 GiB
    is_read_only: () => false;
};

export type MachineVolume = ImmutableVolume | EphemeralVolume | PersistentVolume;

export type ProgramContent = BaseContent & {
    type: MachineType;
    allow_amend: boolean;
    code: CodeContent;
    variables?: { [key: string]: string };
    data?: DataContent;
    export?: Export;
    on: FunctionTriggers;
    environment: FunctionEnvironment;
    resources: MachineResources;
    runtime: FunctionRuntime;
    volumes: MachineVolume[];
    replaces?: string;
};
