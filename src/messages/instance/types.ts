import { BaseExecutableContent, ParentVolume, VolumePersistence, Chain, PaymentType } from "../types";

/**
 * Root file system of a VM instance.
 * The root file system of an instance is built as a copy of a reference image, named parent image. The user determines a custom size and persistence model.
 */
export type RootfsVolume = {
    parent: ParentVolume;
    persistence: VolumePersistence;
    size_mib: number; //Limit to 1 GiB
};

export type Payment = {
    chain: Chain;
    receiver: string;
    type: PaymentType;
};

/**
 * Message content for scheduling a VM instance on the network.
 *
 * rootfs: Root filesystem of the system, will be booted by the kernel"
 */
export type InstanceContent = BaseExecutableContent & {
    rootfs: RootfsVolume;
};
