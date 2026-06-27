import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthService } from "../services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [session, setSession] = useState(null);
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let mounted = true;

		async function initialize() {
			try {
				const {
					data: { session },
				} = await AuthService.getSession();

				if (!mounted) return;

				setSession(session);
				setUser(session?.user ?? null);
			} catch (error) {
				console.error("Failed to initialize auth:", error);
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		}

		initialize();

		const {
			data: { subscription },
		} = AuthService.onAuthStateChange((_event, session) => {
			if (!mounted) return;

			setSession(session);
			setUser(session?.user ?? null);
			setLoading(false);
		});

		return () => {
			mounted = false;
			subscription.unsubscribe();
		};
	}, []);

	const value = useMemo(
		() => ({
			session,
			user,
			isAuthenticated: !!session,
			loading,
		}),
		[session, user, loading],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error("useAuthContext must be used inside AuthProvider");
	}

	return context;
}
