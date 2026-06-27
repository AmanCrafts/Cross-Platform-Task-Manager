import client from "../api/client";

export const ProfileService = {
	async getMyProfile() {
		const { data } = await client.get("api/profile/me");
		return data;
	},

	async updateMyProfile(payload) {
		const { data, error } = await client.patch("api/profile/me", payload);
		if (error) console.error(error);
		return data;
	},
};
