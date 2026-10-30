module.exports = {
  input: "./src/parser/grammar.pegjs",
  output: "./src/parser/generated/grammar.js",
  format: "es",
  dts: true,
  returnTypes: {
    Start: 'import("../../ast/nodes.js").ExpressionNode',
  },
};
