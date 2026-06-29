import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// expo-secure-store has no real web implementation (its web entry exports an
// empty object), and `@expo/router-server` probes the storage adapter with
// AsyncStorage-shaped methods during static prerender. On web we fall back to
// a synchronous localStorage adapter, which Supabase's SupportedStorage
// interface accepts (it allows sync or async values).
const isWeb = Platform.OS === "web";

const SecureStoreAdapter = isWeb
	? {
			getItem: (key) => {
				try {
					return globalThis.localStorage?.getItem(key) ?? null;
				} catch {
					return null;
				}
			},
			setItem: (key, value) => {
				try {
					globalThis.localStorage?.setItem(key, value);
				} catch {
					// ignore quota / disabled storage errors
				}
			},
			removeItem: (key) => {
				try {
					globalThis.localStorage?.removeItem(key);
				} catch {
					// ignore
				}
			},
		}
	: {
			getItem: (key) => SecureStore.getItemAsync(key),
			setItem: (key, value) => SecureStore.setItemAsync(key, value),
			removeItem: (key) => SecureStore.deleteItemAsync(key),
		};

export const supabase = createClient(
	process.env.EXPO_PUBLIC_SUPABASE_URL,
	process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
	{
		auth: {
			storage: SecureStoreAdapter,
			autoRefreshToken: true,
			persistSession: true,
			detectSessionInUrl: false,
		},
	},
);
