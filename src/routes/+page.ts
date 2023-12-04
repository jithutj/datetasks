import Database from "$lib/Database";
import { formatDateOnly, getBeforeDaySince } from "$lib/utils/date";
import PouchDB from 'pouchdb';
import { tick } from "svelte";

const { emit } = PouchDB;
export async function load() {

    const db = Database.getInstance().getDB();
    const todayDate = new Date();
    const today = formatDateOnly(todayDate);
    
    try {

      const result = await db.createIndex({
        index: {
          fields: ['date']
        }
      });
      await tick()

      const { docs } = await db.find({
				selector: { date: { $lte: today, $gte: getBeforeDaySince(today, 5) } },
				sort: ['date'],
			});

     
      await tick()

      return {
        todos: docs
      }

    } catch (err) {
      console.log(err);
    }
}