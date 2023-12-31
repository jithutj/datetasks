import PouchDB from 'pouchdb';
import PouchdbFind from 'pouchdb-find';

class Database {
  private static instance: Database;
  private db: PouchDB.Database;

  private DBNAME = 'notesdb';

  private constructor() {
    // Initialize your PouchDB instance
    PouchDB.plugin(PouchdbFind);
    this.db = new PouchDB(this.DBNAME, {auto_compaction: true});
     
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }

    return Database.instance;
  }

  public getDB(): PouchDB.Database {
    return this.db;
  }
}

export default Database;