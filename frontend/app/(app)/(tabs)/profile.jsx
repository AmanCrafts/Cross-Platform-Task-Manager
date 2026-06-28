// Profile / onboarding screen.
// ProfileAvatar at top, InputFields for the editable profile, a row of
// timezone preset chips, sign-out as a danger TextButton that triggers
// ConfirmationModal. Avatar field is renamed to avatar_url to match
// the backend's canonical field name (backend/src/services/profile.service.js).

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import AppHeader from "../../../src/components/ui/AppHeader";
import Chip from "../../../src/components/ui/Chip";
import ConfirmationModal from "../../../src/components/ui/ConfirmationModal";
import Divider from "../../../src/components/ui/Divider";
import InputField from "../../../src/components/ui/InputField";
import KeyboardAvoidingWrap from "../../../src/components/ui/KeyboardAvoidingWrap";
import LoadingState from "../../../src/components/ui/LoadingState";
import PrimaryButton from "../../../src/components/ui/PrimaryButton";
import ProfileAvatar from "../../../src/components/ui/ProfileAvatar";
import ScreenContainer from "../../../src/components/ui/ScreenContainer";
import TextButton from "../../../src/components/ui/TextButton";
import { useAuth } from "../../../src/hooks/useAuth";
import { useToast } from "../../../src/hooks/useToast";
import { AuthService } from "../../../src/services/auth.service";
import { ProfileService } from "../../../src/services/profile.service";
import { TaskService } from "../../../src/services/task.service";
import { colors, radius, spacing, typography } from "../../../src/theme";

const TIMEZONE_PRESETS = [
	"UTC",
	"America/Los_Angeles",
	"America/New_York",
	"Europe/London",
	"Europe/Berlin",
	"Asia/Kolkata",
	"Asia/Tokyo",
];

const INITIAL_FORM = {
	username: "",
	full_name: "",
	avatar_url: "",
	bio: "",
	timezone: "",
	locale: "en",
	theme: "system",
};

export default function ProfileScreen() {
	const router = useRouter();
	const { profile, refreshProfile, user, profileLoading } = useAuth();
	const { show } = useToast();

	const [form, setForm] = useState(INITIAL_FORM);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [logoutVisible, setLogoutVisible] = useState(false);
	const [loggingOut, setLoggingOut] = useState(false);

	useEffect(() => {
		if (!profile) return;

		setForm({
			username: profile.username ?? "",
			full_name: profile.full_name ?? "",
			avatar_url: profile.avatar_url ?? "",
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

	const canSave =
		form.username.trim().length > 0 && form.full_name.trim().length > 0;

	const handleAvatarPress = () => {
		show({ message: "Avatar upload coming soon", tone: "default" });
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

		setSaving(true);
		const result = await ProfileService.updateMyProfile({
			username: form.username.trim(),
			full_name: form.full_name.trim(),
			avatar_url: form.avatar_url?.trim() || null,
			bio: form.bio?.trim() || null,
			timezone: form.timezone?.trim() || null,
			locale: form.locale?.trim() || "en",
			theme: form.theme?.trim() || "system",
			onboarding_completed: true,
		});
		setSaving(false);

		if (!result?.success) {
			setError(result?.message || "Failed to update profile.");
			return;
		}

		await refreshProfile();
		show({ message: "Profile saved", tone: "success" });
	};

	const handleLogout = async () => {
		setLoggingOut(true);
		await TaskService.clearLocalCache();
		await AuthService.signOut();
		setLoggingOut(false);
		setLogoutVisible(false);
		router.replace("/(auth)/login");
	};

	if (profileLoading && !profile) {
		return (
			<ScreenContainer padded={false} background="background">
				<View style={styles.headerWrap}>
					<AppHeader title="Profile" />
				</View>
				<LoadingState label="Loading profile..." />
			</ScreenContainer>
		);
	}

	return (
		<ScreenContainer padded={false} background="background">
			<View style={styles.headerWrap}>
				<AppHeader
					title="Profile"
					subtitle={user?.email ?? "Edit your profile"}
					trailing={
						<TextButton
							label={saving ? "Saving..." : "Save"}
							tone="brand"
							disabled={!canSave || saving}
							onPress={handleSave}
						/>
					}
				/>
			</View>

			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={styles.flex}
				keyboardVerticalOffset={Platform.OS === "ios" ? spacing.lg : 0}
			>
				<KeyboardAvoidingWrap scroll contentContainerStyle={styles.content}>
					<View style={styles.avatarSection}>
						<ProfileAvatar
							uri={form.avatar_url || profile?.avatar_url}
							name={form.full_name || user?.email}
							size={96}
							editable
							onPress={handleAvatarPress}
						/>
						<Text style={styles.avatarHelper}>Tap to change your photo</Text>
					</View>

					{error ? (
						<View style={styles.errorBanner}>
							<Ionicons
								name="alert-circle-outline"
								size={18}
								color={colors.semantic.danger}
							/>
							<Text style={styles.errorText}>{error}</Text>
						</View>
					) : null}

					<Text style={styles.sectionLabel}>Account</Text>

					<InputField
						label="Username"
						value={form.username}
						onChangeText={(text) => updateField("username", text)}
						placeholder="your-handle"
						autoCapitalize="none"
					/>

					<InputField
						label="Full name"
						value={form.full_name}
						onChangeText={(text) => updateField("full_name", text)}
						placeholder="Your name"
					/>

					<InputField
						label="Bio"
						value={form.bio}
						onChangeText={(text) => updateField("bio", text)}
						placeholder="A short line about you"
						multiline
						numberOfLines={4}
					/>

					<View style={styles.dividerWrap}>
						<Divider />
					</View>

					<Text style={styles.sectionLabel}>Preferences</Text>

					<InputField
						label="Timezone"
						value={form.timezone}
						onChangeText={(text) => updateField("timezone", text)}
						placeholder="Asia/Kolkata"
						autoCapitalize="none"
						helper="Used to render due dates and reminders."
					/>

					<View style={styles.presetRow}>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.presetScroll}
						>
							{TIMEZONE_PRESETS.map((tz) => (
								<Chip
									key={tz}
									label={tz}
									selected={form.timezone === tz}
									onPress={() => updateField("timezone", tz)}
									size="sm"
								/>
							))}
						</ScrollView>
					</View>

					<InputField
						label="Locale"
						value={form.locale}
						onChangeText={(text) => updateField("locale", text)}
						placeholder="en"
						autoCapitalize="none"
					/>

					<PrimaryButton
						label={saving ? "Saving..." : "Save profile"}
						onPress={handleSave}
						loading={saving}
						disabled={!canSave}
						size="lg"
						fullWidth
						style={styles.saveButton}
					/>

					<View style={styles.dividerWrap}>
						<Divider />
					</View>

					<View style={styles.logoutRow}>
						<TextButton
							label="Sign out"
							tone="danger"
							fullWidth
							onPress={() => setLogoutVisible(true)}
						/>
					</View>
				</KeyboardAvoidingWrap>
			</KeyboardAvoidingView>

			<ConfirmationModal
				visible={logoutVisible}
				title="Sign out?"
				description="Your tasks stay safe. You can sign back in any time."
				confirmLabel="Sign out"
				cancelLabel="Cancel"
				tone="danger"
				loading={loggingOut}
				onConfirm={handleLogout}
				onCancel={() => setLogoutVisible(false)}
			/>
		</ScreenContainer>
	);
}

const styles = StyleSheet.create({
	headerWrap: {
		paddingHorizontal: spacing.base,
	},
	flex: {
		flex: 1,
	},
	content: {
		paddingHorizontal: spacing.base,
		paddingBottom: spacing["3xl"],
	},
	avatarSection: {
		alignItems: "center",
		paddingVertical: spacing.lg,
		gap: spacing.sm,
	},
	avatarHelper: {
		...typography.caption,
		color: colors.text.secondary,
	},
	sectionLabel: {
		...typography.overline,
		color: colors.text.muted,
		marginBottom: spacing.sm,
	},
	dividerWrap: {
		marginVertical: spacing.xl,
	},
	presetRow: {
		marginTop: -spacing.sm,
		marginBottom: spacing.base,
	},
	presetScroll: {
		gap: spacing.sm,
		paddingVertical: spacing.xs,
	},
	saveButton: {
		marginTop: spacing.lg,
	},
	errorBanner: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		padding: spacing.md,
		borderRadius: radius.md,
		backgroundColor: colors.semantic.dangerBg,
		marginBottom: spacing.base,
	},
	errorText: {
		...typography.body,
		color: colors.semantic.danger,
		flex: 1,
	},
	logoutRow: {
		marginTop: spacing.md,
	},
});
