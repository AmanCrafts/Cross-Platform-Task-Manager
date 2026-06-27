import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

const SecureStoreAdapter = {
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
