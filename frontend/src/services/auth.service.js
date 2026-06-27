import { supabase } from "../lib/supabase";

export const AuthService = {
	signUp(email, password) {
		return supabase.auth.signUp({
			email,
			password,
		});
	},

	signIn(email, password) {
		return supabase.auth.signIn({
			email,
			password,
		});
	},

	signOut() {
		return supabase.auth.signOut();
	},

	getSession() {
		return supabase.auth.getSession();
	},

	getUser() {
		return supabase.auth.getUser();
	},

	onAuthStateChange(callback) {
		return supabase.auth.onAuthStateChange(callback);
	},
};
