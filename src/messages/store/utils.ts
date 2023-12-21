import shajs from "sha.js";

export async function blobToBuffer(blob: Blob | File): Promise<Buffer> {
    const arrayBuffer = await blob.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

export function calculateSHA256Hash(data: ArrayBuffer | Buffer): string {
    const buffer = Buffer.from(data);
    return new shajs.sha256().update(buffer).digest("hex");
}
