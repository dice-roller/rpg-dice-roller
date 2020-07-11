export default CompareOperatorError;
declare class CompareOperatorError extends TypeError {
    constructor(operator: any);
    operator: any;
}
