export default DieActionValueError;
declare class DieActionValueError extends Error {
    constructor(die: any, action?: any);
    action: any;
    die: any;
}
