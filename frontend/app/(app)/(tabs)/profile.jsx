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
import Screen from "../../../src/components/Screen";
import { useAuth } from "../../../src/hooks/useAuth";
import { ProfileService } from "../../../src/services/profile.service";

const INITIAL_FORM = {
	username: "",
	full_name: "",
	avatar_path: "",
	bio: "",
	timezone: "",
	locale: "en",
	theme: "system",
};

export default function ProfileScreen() {
	const router = useRouter();
	const { profile, refreshProfile, user } = useAuth();

	const [form, setForm] = useState(INITIAL_FORM);
	const [loading, _setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!profile) return;

		setForm({
			username: profile.username ?? "",
			full_name: profile.full_name ?? "",
			avatar_path: profile.avatar_path ?? "",
			bio: profile.bio ?? "",
			timezone: profile.timezone ?? "",
			locale: profile.locale ?? "en",
			theme: profile.theme ?? "system",
		});
	}, [profile]);

	const updateField = (field, value) => {
		setForm((previous) => ({
			...previous,
			[field]: value,
		}));
	};

	const handleSave = async () => {
		setError("");

		if (!form.username.trim()) {
			setError("Username is required.");
			return;
		}

		if (!form.full_name.trim()) {
			setError("Full name is required.");
			return;
		}

		try {
			setSaving(true);

			const result = await ProfileService.updateMyProfile({
				username: form.username.trim(),
				full_name: form.full_name.trim(),
				avatar_path: form.avatar_path.trim() || null,
				bio: form.bio.trim() || null,
				timezone: form.timezone.trim() || null,
				locale: form.locale.trim() || "en",
				theme: form.theme.trim() || "system",
				onboarding_completed: true,
			});

			if (!result.success) {
				setError(result.message || "Failed to update profile.");
				return;
			}

			await refreshProfile();
			Alert.alert("Success", "Profile saved successfully.");
			router.replace("/(app)/(tabs)");
		} catch (err) {
			setError(err?.message || "Something went wrong.");
		} finally {
			setSaving(false);
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
		<Screen>
			<ScrollView
				contentContainerStyle={styles.container}
				keyboardShouldPersistTaps="handled"
			>
				<Text style={styles.title}>Profile</Text>
				<Text style={styles.subtitle}>
					{user?.email ? `Signed in as ${user.email}` : "Edit your profile"}
				</Text>

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<Text style={styles.label}>Username *</Text>
				<TextInput
					style={styles.input}
					value={form.username}
					onChangeText={(text) => updateField("username", text)}
					placeholder="username"
					autoCapitalize="none"
				/>

				<Text style={styles.label}>Full name *</Text>
				<TextInput
					style={styles.input}
					value={form.full_name}
					onChangeText={(text) => updateField("full_name", text)}
					placeholder="Full name"
				/>

				<Text style={styles.label}>Avatar path</Text>
				<TextInput
					style={styles.input}
					value={form.avatar_path}
					onChangeText={(text) => updateField("avatar_path", text)}
					placeholder="Storage path for avatar"
					autoCapitalize="none"
				/>

				<Text style={styles.label}>Bio</Text>
				<TextInput
					style={[styles.input, styles.textArea]}
					value={form.bio}
					onChangeText={(text) => updateField("bio", text)}
					placeholder="Short bio"
					multiline
				/>

				<Text style={styles.label}>Timezone</Text>
				<TextInput
					style={styles.input}
					value={form.timezone}
					onChangeText={(text) => updateField("timezone", text)}
					placeholder="Asia/Kolkata"
					autoCapitalize="none"
				/>

				<Text style={styles.label}>Locale</Text>
				<TextInput
					style={styles.input}
					value={form.locale}
					onChangeText={(text) => updateField("locale", text)}
					placeholder="en"
					autoCapitalize="none"
				/>

				<Text style={styles.label}>Theme</Text>
				<TextInput
					style={styles.input}
					value={form.theme}
					onChangeText={(text) => updateField("theme", text)}
					placeholder="system"
					autoCapitalize="none"
				/>

				<TouchableOpacity
					style={[styles.button, saving && styles.buttonDisabled]}
					onPress={handleSave}
					disabled={saving}
				>
					{saving ? (
						<ActivityIndicator color="#fff" />
					) : (
						<Text style={styles.buttonText}>Save Profile</Text>
					)}
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.secondaryButton}
					onPress={() => router.replace("/(app)/(tabs)")}
				>
					<Text style={styles.secondaryButtonText}>Back Home</Text>
				</TouchableOpacity>
			</ScrollView>
		</Screen>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 20,
		paddingBottom: 32,
		backgroundColor: "#fff",
	},
	center: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	title: {
		fontSize: 28,
		fontWeight: "700",
		color: "#111",
	},
	subtitle: {
		marginTop: 6,
		marginBottom: 20,
		color: "#666",
	},
	error: {
		color: "crimson",
		marginBottom: 12,
		fontWeight: "600",
	},
	label: {
		marginBottom: 8,
		fontSize: 14,
		fontWeight: "600",
		color: "#222",
	},
	input: {
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 12,
		marginBottom: 16,
		backgroundColor: "#fafafa",
		color: "#111",
	},
	textArea: {
		minHeight: 100,
	},
	button: {
		marginTop: 8,
		backgroundColor: "#111",
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: "center",
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	buttonText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 15,
	},
	secondaryButton: {
		marginTop: 12,
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#ddd",
	},
	secondaryButtonText: {
		color: "#111",
		fontWeight: "700",
		fontSize: 15,
	},
});
