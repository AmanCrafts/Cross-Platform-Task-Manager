import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../src/hooks/useAuth";

// Auth-group layout. Waits for both auth and profile to resolve before
// deciding whether to keep the user on login or bounce them into the app.
// This prevents flicker on cold start and the wrong-screen-on-first-render
// bug.
export default function AuthLayout() {
	const { session, initializing, needsOnboarding } = useAuth();

	if (initializing) {
		return (
			<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
				<ActivityIndicator />
			</View>
		);
	}

	if (session) {
		if (needsOnboarding) {
			return <Redirect href="/(app)/(tabs)/profile" />;
		}

		return <Redirect href="/(app)/(tabs)" />;
	}

	return <Stack screenOptions={{ headerShown: false }} />;
}
