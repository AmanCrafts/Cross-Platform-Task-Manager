import { supabase } from "../lib/supabase";

export const AuthService = {
	async signUp(email, password) {
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
		});

		if (error) {
			return {
				success: false,
				message: error.message || "Something went wrong. Please try again.",
				code: error.code || "unknown_error",
			};
		}
		return {
			success: true,
			data,
		};
	},

	async signIn(email, password) {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			return {
				success: false,
				message: error.message || "Something went wrong. Please try again.",
				code: error.code || "unknown_error",
			};
		}
		return {
			success: true,
			data,
		};
	},

	async signOut() {
		const { error } = await supabase.auth.signOut();
		if (error) {
			return {
				success: false,
				message: error.message || "Something went wrong. Please try again.",
				code: error.code || "unknown_error",
			};
		}
		return {
			success: true,
		};
	},

	async getSession() {
		return await supabase.auth.getSession();
	},

	async getUser() {
		const { data, error } = await supabase.auth.getUser();
		if (error) {
			return {
				success: false,
				message: error.message || "Something went wrong. Please try again.",
				code: error.code || "unknown_error",
			};
		}
		return {
			success: true,
			data,
		};
	},

	onAuthStateChange(callback) {
		return supabase.auth.onAuthStateChange(callback);
	},
};
