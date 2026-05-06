import { getDb } from '../database/db.js';

export class BaseRepository {
  constructor() {
    this.db = getDb();
  }
}
