import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../src/hooks/useAuth";

// Root redirector. Waits for both auth and profile to resolve before
// making a navigation decision so we never bounce to Profile on a
// cold start just because the profile request is still in flight.
export default function Index() {
	const { session, initializing, needsOnboarding } = useAuth();

	if (initializing) {
		return (
			<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
				<ActivityIndicator />
			</View>
		);
	}

	if (!session) {
		return <Redirect href="/(auth)/login" />;
	}

	if (needsOnboarding) {
		return <Redirect href="/(app)/(tabs)/profile" />;
	}

	return <Redirect href="/(app)/(tabs)" />;
}
