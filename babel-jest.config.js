module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: { node: "current" },
        // Keep ES module imports intact for Jest's transform pipeline
        modules: "commonjs",
      },
    ],
  ],
};
