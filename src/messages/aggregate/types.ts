export type AggregateKey = {
    name: string;
}

export type AggregateContent<T> = {
    address: string;
    key: string | AggregateKey;
    content: T;
    time: number;
};
