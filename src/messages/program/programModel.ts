import { BaseContent, MachineVolume } from "../types";
import { FunctionEnvironment, MachineResources, Chain, PaymentType } from "../types";

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
    interface: string;
    args: string[];
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
    persistent?: boolean;
};

/**
 * Execution runtime (rootfs with Python interpreter)
 */
export type FunctionRuntime = {
    ref: string;
    use_latest: boolean;
    comment: string;
};

/**
 * Payment solution
 */
export type Payment = {
    chain: Chain;
    receiver?: string;
    type: PaymentType;
};

export type ProgramContent = BaseContent & {
    type: MachineType;
    allow_amend: boolean;
    code: CodeContent;
    variables?: { [key: string]: string };
    data?: DataContent;
    export?: Export;
    on: FunctionTriggers;
    metadata?: Record<string, any>;
    environment: FunctionEnvironment;
    resources: MachineResources;
    runtime: FunctionRuntime;
    volumes: MachineVolume[];
    payment?: Payment;
    replaces?: string;
};
