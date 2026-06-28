module.exports = (api) => {
	api.cache(true);

	return {
		presets: ["babel-preset-expo"],
		// react-native-worklets/plugin must be the LAST plugin. It is
		// required for react-native-reanimated 4 + worklets 0.8.
		plugins: ["react-native-worklets/plugin"],
	};
};
