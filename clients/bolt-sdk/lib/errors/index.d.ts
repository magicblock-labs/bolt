type ErrorWithCode = Error & {
    code: number;
};
type MaybeErrorWithCode = ErrorWithCode | null | undefined;
export declare class InvalidAuthorityError extends Error {
    readonly code: number;
    readonly name: string;
    constructor();
}
export declare function errorFromCode(code: number): MaybeErrorWithCode;
export declare function errorFromName(name: string): MaybeErrorWithCode;
export {};
//# sourceMappingURL=index.d.ts.map