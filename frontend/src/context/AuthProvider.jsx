import NetInfo from "@react-native-community/netinfo";
import * as SecureStore from "expo-secure-store";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	isNetworkOnline,
	startNetworkMonitor,
} from "../offline/network.monitor";
import { syncNowIfPossible } from "../offline/sync.engine";
import { AuthService } from "../services/auth.service";
import { ProfileService } from "../services/profile.service";

const AuthContext = createContext(null);
const DEVICE_ID_KEY = "taskflow_device_id";

async function getOrCreateDeviceId() {
	const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);

	if (existing) {
		return existing;
	}

	const nextId = `device_${Date.now()}_${Math.random()
		.toString(36)
		.slice(2, 10)}`;

	await SecureStore.setItemAsync(DEVICE_ID_KEY, nextId);

	return nextId;
}

function stopMonitor(ref) {
	if (typeof ref.current === "function") {
		ref.current();
	}

	ref.current = null;
}

export function AuthProvider({ children }) {
	const [session, setSession] = useState(null);
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	const [deviceId, setDeviceId] = useState(null);
	const [syncing, setSyncing] = useState(false);
	const [syncError, setSyncError] = useState("");
	const [lastSyncedAt, setLastSyncedAt] = useState(null);

	const [profile, setProfile] = useState(null);
	const [profileLoading, setProfileLoading] = useState(true);

	const monitorStopRef = useRef(null);
	const mountedRef = useRef(true);

	useEffect(() => {
		mountedRef.current = true;

		let mounted = true;

		async function initialize() {
			try {
				const {
					data: { session },
				} = await AuthService.getSession();

				if (!mounted) return;

				setSession(session ?? null);
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
		} = AuthService.onAuthStateChange((_event, nextSession) => {
			if (!mounted) return;

			setSession(nextSession ?? null);
			setUser(nextSession?.user ?? null);
			setLoading(false);

			if (!nextSession) {
				setProfile(null);
			}
		});

		return () => {
			mounted = false;
			mountedRef.current = false;
			subscription.unsubscribe();
		};
	}, []);

	const refreshSync = useCallback(async () => {
		if (!user?.id) {
			return {
				success: false,
				message: "No authenticated user.",
			};
		}

		try {
			setSyncing(true);
			setSyncError("");

			const currentDeviceId = deviceId ?? (await getOrCreateDeviceId());
			setDeviceId(currentDeviceId);

			const result = await syncNowIfPossible({
				userId: user.id,
				deviceId: currentDeviceId,
			});

			if (result.success) {
				setLastSyncedAt(new Date().toISOString());
			} else {
				setSyncError(result.message || "Sync failed.");
			}

			return result;
		} catch (error) {
			const message = error?.message || "Sync failed.";
			setSyncError(message);

			return {
				success: false,
				message,
			};
		} finally {
			setSyncing(false);
		}
	}, [deviceId, user?.id]);

	const refreshProfile = useCallback(async () => {
		if (!user?.id) {
			setProfile(null);
			return { success: true, data: null };
		}

		setProfileLoading(true);
		try {
			const response = await ProfileService.getMyProfile();
			// Backend envelope: { success, data: <profile> }. Be defensive
			// about nested shapes in case the response is unwrapped.
			const profileData = response?.data?.data ?? response?.data ?? null;
			setProfile(profileData);
			return { success: true, data: profileData };
		} catch (error) {
			return {
				success: false,
				message: error?.message || "Failed to load profile.",
			};
		} finally {
			if (mountedRef.current) {
				setProfileLoading(false);
			}
		}
	}, [user?.id]);

	useEffect(() => {
		let cancelled = false;

		async function bootstrapOffline() {
			stopMonitor(monitorStopRef);
			setSyncError("");
			setLastSyncedAt(null);

			if (!user?.id) {
				setDeviceId(null);
				setSyncing(false);
				return;
			}

			setSyncing(true);

			try {
				const currentDeviceId = await getOrCreateDeviceId();
				if (cancelled || !mountedRef.current) return;

				setDeviceId(currentDeviceId);

				const networkState = await NetInfo.fetch();

				// Kick off sync (if online) and profile fetch in parallel.
				// Profile fetch does not block sync and does not gate UI.
				const profileFetch = refreshProfile();

				if (isNetworkOnline(networkState)) {
					const result = await syncNowIfPossible({
						userId: user.id,
						deviceId: currentDeviceId,
					});

					if (cancelled || !mountedRef.current) return;

					if (result.success) {
						setLastSyncedAt(new Date().toISOString());
						setSyncError("");
					} else {
						setSyncError(result.message || "Initial sync failed.");
					}
				}

				await profileFetch;

				if (cancelled || !mountedRef.current) return;

				monitorStopRef.current = startNetworkMonitor({
					userId: user.id,
					deviceId: currentDeviceId,
					onSynced: () => {
						if (!mountedRef.current) return;
						setLastSyncedAt(new Date().toISOString());
						setSyncError("");
					},
					onError: (error) => {
						if (!mountedRef.current) return;
						setSyncError(error?.message || "Offline sync failed.");
					},
				});
			} catch (error) {
				if (!cancelled && mountedRef.current) {
					setSyncError(error?.message || "Failed to initialize offline sync.");
				}
			} finally {
				if (!cancelled && mountedRef.current) {
					setSyncing(false);
				}
			}
		}

		bootstrapOffline();

		return () => {
			cancelled = true;
			stopMonitor(monitorStopRef);
		};
	}, [user?.id, refreshProfile]);

	const value = useMemo(
		() => ({
			session,
			user,
			isAuthenticated: !!session,
			loading,

			deviceId,
			syncing,
			syncError,
			lastSyncedAt,
			refreshSync,

			profile,
			profileLoading,
			refreshProfile,
			// True only when we have a session AND the profile has resolved
			// AND the server says onboarding hasn't been completed. While
			// profileLoading is true (initial fetch in flight) we must
			// return false — otherwise routing will bounce to the Profile
			// screen on every cold start before the profile arrives.
			needsOnboarding:
				!!session && !profileLoading && profile?.onboarding_completed === false,
			// True until both auth AND profile are fully resolved for the
			// current session. Use this in route guards to prevent
			// flicker / incorrect redirects during cold start.
			initializing: loading || (!!session && profileLoading),
		}),
		[
			session,
			user,
			loading,
			deviceId,
			syncing,
			syncError,
			lastSyncedAt,
			refreshSync,
			profile,
			profileLoading,
			refreshProfile,
		],
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
