import NetInfo from "@react-native-community/netinfo";
import { syncNowIfPossible } from "./sync.engine.js";

export function isNetworkOnline(state) {
	return !!state?.isConnected && state.isInternetReachable !== false;
}

export async function isOnline() {
	const state = await NetInfo.fetch();
	return isNetworkOnline(state);
}

export function startNetworkMonitor({ userId, deviceId, onSynced, onError }) {
	const unsubscribe = NetInfo.addEventListener(async (state) => {
		console.log("Network changed", state);

		if (!isNetworkOnline(state)) return;

		try {
			const result = await syncNowIfPossible({ userId, deviceId });
			console.log("Sync result", result);
			if (result.success) {
				onSynced?.(result);
			} else {
				onError?.(new Error(result.message || "Sync failed."));
			}
		} catch (error) {
			onError?.(error);
		}
	});

	return unsubscribe;
}
