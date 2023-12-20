import shajs from "sha.js";

export function calculateSHA256Hash(data: ArrayBuffer | Buffer): string {
    const buffer = Buffer.from(data);
    return new shajs.sha256().update(buffer).digest("hex");
}
