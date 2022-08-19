export declare const genPassword: (password: any) => {
    salt: string;
    hash: string;
};
export declare const validatePassword: (password: any, hash: any, salt: any) => boolean;
export declare const issueJWT: (user: any) => {
    token: string;
    expires: string;
};
