import { db } from "../config/db.js";

export async function fetchMyProfile(userId) {
	const { data, error } = await db
		.from("profiles")
		.select("*")
		.eq("id", userId)
		.single();

	if (error) throw error;

	return data;
}

export async function patchMyProfile(userId, payload) {
	const { data, error } = await db
		.from("profiles")
		.update({
			username: payload.username,
			full_name: payload.full_name,
			bio: payload.bio,
			timezone: payload.timezone,
			locale: payload.locale,
			onboarding_completed: payload.onboarding_completed,
			avatart_url: payload.avatart_url,
			updated_at: new Date().toISOString(),
		})
		.eq("id", userId)
		.select()
		.single();

	if (error) throw error;

	return data;
}
