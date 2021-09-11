import axios from 'axios';
import { DEFAULT_API_V2 } from '../../index';

type AggregateGetResponse<T> = {
    data: T;
};

type AggregateGetConfiguration = {
    APIServer: string;
    address: string;
    keys: Array<string>;
};

export async function Get<T>(
    configuration: AggregateGetConfiguration = {
        APIServer: DEFAULT_API_V2,
        address: '',
        keys: [],
    },
): Promise<T> {
    const keys = configuration.keys.length === 0 ? null : configuration.keys.join(',');
    const response = await axios.get<AggregateGetResponse<T>>(
        `${configuration.APIServer}/api/v0/aggregates/${configuration.address}.json`,
        {
            params: {
                keys: keys,
            },
        },
    );

    if (!response.data.data) {
        throw new Error('no aggregate found');
    }
    return response.data.data;
}
