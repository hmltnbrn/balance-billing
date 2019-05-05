const presets = [
  [
    "@babel/env",
    {
      targets: {
        "browsers": ["last 2 versions", "ie >= 11"]
      },
    },
  ],
];

const plugins = [
  [
    "transform-es2015-template-literals", {
      "loose": true,
      "spec": true
    }
  ],
  [
    "@babel/plugin-transform-spread", {
      "loose": false
    }
  ]
];

module.exports = { presets, plugins };
