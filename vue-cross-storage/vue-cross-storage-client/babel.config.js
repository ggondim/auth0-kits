module.exports = {
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "node": "8"
        }
      }
    ]
  ],
  "plugins": ["babel-plugin-add-module-exports", "babel-plugin-transform-async-to-generator"]
}
