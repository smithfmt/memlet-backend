export declare const validateSignup: ((req: any, res: any, next: any) => void)[];
export declare const signup: (req: any, res: any) => Promise<void>;
export declare const validateLogin: ((req: any, res: any, next: any) => void)[];
export declare const login: (req: any, res: any, next: any) => Promise<void>;
export declare const validateUpdate: ((req: any, res: any, next: any) => void)[];
export declare const updateProfile: (req: any, res: any, next: any) => Promise<void>;
declare const _default: {
    validateSignup: ((req: any, res: any, next: any) => void)[];
    signup: (req: any, res: any) => Promise<void>;
    validateLogin: ((req: any, res: any, next: any) => void)[];
    login: (req: any, res: any, next: any) => Promise<void>;
    validateUpdate: ((req: any, res: any, next: any) => void)[];
    updateProfile: (req: any, res: any, next: any) => Promise<void>;
};
export default _default;
