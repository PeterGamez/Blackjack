export type OmitNumber<T> = {
    [K in keyof T as T[K] extends number ? never : K]: T[K];
};
