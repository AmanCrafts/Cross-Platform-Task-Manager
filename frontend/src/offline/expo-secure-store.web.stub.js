// Web stub for `expo-secure-store`. The real package's web entry exports
// an empty object, and `@expo/router-server` probes the storage adapter
// with AsyncStorage-shaped methods during static prerender. We alias the
// module to this file when building for web so Metro never tries to
// resolve the real package's web entry. Backed by localStorage.

const isBrowser =
	typeof globalThis !== "undefined" &&
	typeof globalThis.localStorage !== "undefined";

function safeGet(key) {
	if (!isBrowser) return Promise.resolve(null);
	try {
		return Promise.resolve(globalThis.localStorage.getItem(key));
	} catch {
		return Promise.resolve(null);
	}
}

function safeSet(key, value) {
	if (!isBrowser) return Promise.resolve();
	try {
		globalThis.localStorage.setItem(key, value);
	} catch {
		// ignore quota / disabled storage
	}
	return Promise.resolve();
}

function safeDelete(key) {
	if (!isBrowser) return Promise.resolve();
	try {
		globalThis.localStorage.removeItem(key);
	} catch {
		// ignore
	}
	return Promise.resolve();
}

export const getItemAsync = (key) => safeGet(key);
export const setItemAsync = (key, value) => safeSet(key, value);
export const deleteItemAsync = (key) => safeDelete(key);

export default {
	getItemAsync,
	setItemAsync,
	deleteItemAsync,
};
