import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../src/hooks/useAuth";

// App-group layout. Waits for both auth and profile to resolve before
// either redirecting to login or showing the tabs. Without this, the
// tabs can render before onboarding_completed is known, and a partially-
// fetched profile leads to a stale redirect.
export default function AppLayout() {
	const { session, initializing } = useAuth();

	if (initializing) {
		return (
			<View
				style={{
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<ActivityIndicator />
			</View>
		);
	}

	if (!session) {
		return <Redirect href="/(auth)/login" />;
	}

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="(tabs)" />
			<Stack.Screen name="tasks/[id]" />
		</Stack>
	);
}
