import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../src/hooks/useAuth";

export default function Index() {
	const { session, loading, needsOnboarding } = useAuth();

	if (loading) {
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
