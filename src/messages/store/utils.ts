import shajs from "sha.js";

export async function blobToBuffer(blob: Blob): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
                resolve(Buffer.from(reader.result));
            } else {
                reject("Failed to convert Blob to Buffer.");
            }
        };
        reader.readAsArrayBuffer(blob);
    });
}

export function calculateSHA256Hash(data: ArrayBuffer | Buffer): string {
    const buffer = Buffer.from(data);
    return new shajs.sha256().update(buffer).digest("hex");
}
