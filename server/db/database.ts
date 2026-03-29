import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = path.join(__dirname, "../data.db");
const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

const initSql = fs.readFileSync(
  path.join(__dirname, "create-tables.sql"),
  "utf-8"
);

db.exec(initSql);

export default db;
