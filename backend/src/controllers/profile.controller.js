import { fetchMyProfile, patchMyProfile } from "../services/profile.service.js";

export async function getMyProfile(req, res) {
	try {
		const profile = await fetchMyProfile(req.user.id);
		res.json({ success: true, data: profile });
	} catch (error) {
		console.error("Error fetching profile:", error);
	}
}

export async function updateMyProfile(req, res) {
	try {
		const profile = await patchMyProfile(req.user.id, req.body);
		res.json({ success: true, data: profile });
	} catch (error) {
		console.error("Error updating profile:", error);
	}
}
