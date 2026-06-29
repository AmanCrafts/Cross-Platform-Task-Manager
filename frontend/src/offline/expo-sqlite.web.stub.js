// Web stub for `expo-sqlite`. The real package ships a WASM-based SQL
// engine that Metro cannot resolve in SDK 56, so we alias the module
// to this file when building for web. The offline cache is a
// native-only feature — on web, the app talks directly to the backend.

function createNoopDatabase() {
	const fail = (method) => () => {
		throw new Error(
			`expo-sqlite is not available on web (called ${method}). ` +
				"Use the network path (task.remote.service.js) on web.",
		);
	};

	return {
		getFirstAsync: fail("getFirstAsync"),
		execAsync: fail("execAsync"),
		withTransactionAsync: fail("withTransactionAsync"),
		runAsync: fail("runAsync"),
		getAllAsync: fail("getAllAsync"),
	};
}

export async function openDatabaseAsync(_name) {
	return createNoopDatabase();
}

export const openDatabaseSync = (_name) => createNoopDatabase();

export default {
	openDatabaseAsync,
	openDatabaseSync,
};
