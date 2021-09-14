import { DEFAULT_API_V2, store } from '../../../src';

function ArraybufferToString(ab: ArrayBuffer) {
    return new TextDecoder().decode(ab);
}

describe('Store message retrieval', () => {
    it('should retrieve a store message correctly', async () => {
        const response = await store.Get({
            fileHash: 'QmQkv43jguT5HLC8TPbYJi2iEmr4MgLgu4nmBoR4zjYb3L',
            APIServer: DEFAULT_API_V2,
        });

        const got = ArraybufferToString(response);
        const expected = 'This is just a test.';

        expect(got).toBe(expected);
    });
});
