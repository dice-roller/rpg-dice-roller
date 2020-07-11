export default RequiredArgumentError;
declare class RequiredArgumentError extends Error {
    constructor(argumentName?: any);
    argumentName: any;
}
