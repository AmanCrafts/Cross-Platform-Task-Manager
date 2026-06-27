import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useAuth } from "../../src/hooks/useAuth";
import { AuthService } from "../../src/services/auth.service";
import { ProfileService } from "../../src/services/profile.service";

export default function ProfileScreen() {
	const router = useRouter();
	const { profile, loading } = useAuth();

	const [form, setForm] = useState({
		username: "",
		full_name: "",
		avatar_url: "",
		bio: "",
		timezone: "",
		locale: "en",
		theme: "system",
	});

	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (!profile) return;

		setForm({
			username: profile.username || "",
			full_name: profile.full_name || "",
			avatar_url: profile.avatar_url || "",
			bio: profile.bio || "",
			timezone: profile.timezone || "",
			locale: profile.locale || "en",
			theme: profile.theme || "system",
		});
	}, [profile]);

	const handleChange = (key, value) => {
		setForm((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	const handleSave = async () => {
		try {
			setSubmitting(true);

			const payload = {
				...form,
				onboarding_completed: true,
			};

			const { error } = await ProfileService.updateMyProfile(payload);

			if (error) {
				throw error;
			}
			router.replace("/(app)");
		} catch (err) {
			Alert.alert("Profile update failed", err?.message || "Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<View style={styles.center}>
				<ActivityIndicator />
			</View>
		);
	}

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Text style={styles.title}>Complete Profile</Text>
			<Text style={styles.subtitle}>
				Finish this once and you will be taken to the app.
			</Text>

			<TextInput
				style={styles.input}
				placeholder="Username"
				value={form.username}
				onChangeText={(text) => handleChange("username", text)}
				autoCapitalize="none"
			/>

			<TextInput
				style={styles.input}
				placeholder="Full name"
				value={form.full_name}
				onChangeText={(text) => handleChange("full_name", text)}
			/>

			<TextInput
				style={styles.input}
				placeholder="Avatar URL"
				value={form.avatar_url}
				onChangeText={(text) => handleChange("avatar_url", text)}
				autoCapitalize="none"
			/>

			<TextInput
				style={[styles.input, styles.textarea]}
				placeholder="Bio"
				value={form.bio}
				onChangeText={(text) => handleChange("bio", text)}
				multiline
			/>

			<TextInput
				style={styles.input}
				placeholder="Timezone"
				value={form.timezone}
				onChangeText={(text) => handleChange("timezone", text)}
				autoCapitalize="none"
			/>

			<TextInput
				style={styles.input}
				placeholder="Locale"
				value={form.locale}
				onChangeText={(text) => handleChange("locale", text)}
				autoCapitalize="none"
			/>

			<TextInput
				style={styles.input}
				placeholder="Theme"
				value={form.theme}
				onChangeText={(text) => handleChange("theme", text)}
				autoCapitalize="none"
			/>

			<TouchableOpacity
				style={styles.button}
				onPress={handleSave}
				disabled={submitting}
			>
				<Text style={styles.buttonText}>
					{submitting ? "Saving..." : "Continue"}
				</Text>
			</TouchableOpacity>

			<TouchableOpacity
				onPress={async () => {
					await AuthService.signOut();
					console.log("Session cleared");
				}}
			>
				<Text>Clear Session</Text>
			</TouchableOpacity>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	container: {
		padding: 24,
		gap: 12,
	},
	title: {
		fontSize: 28,
		fontWeight: "700",
	},
	subtitle: {
		marginBottom: 8,
		color: "#666",
	},
	input: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 14,
	},
	textarea: {
		minHeight: 100,
		textAlignVertical: "top",
	},
	button: {
		marginTop: 8,
		padding: 14,
		borderRadius: 8,
		backgroundColor: "#111",
	},
	buttonText: {
		color: "#fff",
		textAlign: "center",
		fontWeight: "600",
	},
});
