export type BasicEntity = {
    id: string;
    createdAt: Date;
    // ...other common properties...
};

export interface BasicResponse<T = unknown> {
    success: boolean;
    data: T;
    // ...other response properties...
}
