import shajs from "sha.js";

export async function blobToBuffer(blob: Blob | File): Promise<Buffer> {
    const isBrowser = typeof FileReader !== "undefined";
    if (!isBrowser) {
        const arrayBuffer = await blob.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    return new Promise<Buffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
                resolve(Buffer.from(reader.result));
            } else {
                reject("Failed to convert Blob to Buffer.");
            }
        };
        if (!(blob instanceof Blob)) {
            console.log(blob);
        }
        reader.readAsArrayBuffer(blob);
    });
}

export function calculateSHA256Hash(data: ArrayBuffer | Buffer): string {
    const buffer = Buffer.from(data);
    return new shajs.sha256().update(buffer).digest("hex");
}
