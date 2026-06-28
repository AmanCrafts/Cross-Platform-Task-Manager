import { truncateLocalDb } from "./db.js";

export { truncateLocalDb };

export async function cleanLocalDb() {
	await truncateLocalDb();
}
