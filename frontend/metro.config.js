// Metro config — use Expo's defaults. Required by SDK 56 so that
// `expo start` and EAS Build both pick up the same Metro pipeline.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

module.exports = config;
