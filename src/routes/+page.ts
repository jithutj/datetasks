import Database from '$lib/Database';
import { formatDateOnly, getBeforeDaySince } from '$lib/utils/date';
import { tick } from 'svelte';

export async function load() {
	const todayDate = new Date();
	const today = formatDateOnly(todayDate);

	try {
		const dbInstance = Database.getInstance();
		const db = dbInstance ? dbInstance.getDB() : null;
		if (db) {
			const result = await db.createIndex({
				index: {
					fields: ['date']
				}
			});
			await tick();

			const { docs } = await db.find({
				selector: { date: { $lte: today, $gte: getBeforeDaySince(today, 5) } },
				sort: ['date']
			});

			await tick();

			return {
				todos: docs
			};
		}
	} catch (err) {
		// console.log(err);
	}
}
