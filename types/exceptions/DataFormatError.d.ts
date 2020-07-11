export default DataFormatError;
declare class DataFormatError extends Error {
    constructor(data: any);
    data: any;
}
