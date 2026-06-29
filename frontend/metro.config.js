// Metro config — use Expo's defaults. Required by SDK 56 so that
// `expo start` and EAS Build both pick up the same Metro pipeline.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const config = getDefaultConfig(__dirname);

// Alias native-only modules to web stubs so Metro never tries to resolve
// their WASM/empty web entries during `expo export --platform web`.
// On web, the offline SQLite cache is unused (network path via the
// backend) and SecureStore is backed by localStorage.
const webStubs = {
	"expo-sqlite": path.resolve(__dirname, "src/offline/expo-sqlite.web.stub.js"),
	"expo-secure-store": path.resolve(
		__dirname,
		"src/offline/expo-secure-store.web.stub.js",
	),
};

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
	if (platform === "web" && Object.hasOwn(webStubs, moduleName)) {
		return { type: "sourceFile", filePath: webStubs[moduleName] };
	}

	if (typeof originalResolveRequest === "function") {
		return originalResolveRequest(context, moduleName, platform);
	}

	return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
