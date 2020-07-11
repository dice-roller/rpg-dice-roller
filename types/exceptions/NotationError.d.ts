export default NotationError;
declare class NotationError extends Error {
    constructor(notation: any);
    notation: any;
}
