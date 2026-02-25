use rusqlite::{params, Connection, Result};
use serde::{Serialize, Deserialize};
use std::sync::Mutex;

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new() -> Result<Self> {
        let conn = Connection::open("pocket.db")?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS transcripts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                synced INTEGER NOT NULL DEFAULT 0
            )",
            [],
        )?;

        Ok(Database {
            conn: Mutex::new(conn),
        })
    }

    pub fn add_transcript(&self, title: &str, content: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO transcripts (title, content, created_at, synced)
             VALUES (?1, ?2, datetime('now'), 0)",
            params![title, content],
        )?;
        Ok(())
    }

    pub fn get_transcripts(&self) -> Result<Vec<Transcript>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, content, created_at, synced FROM transcripts ORDER BY created_at DESC"
        )?;

        let transcript_iter = stmt.query_map([], |row| {
            Ok(Transcript {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                created_at: row.get(3)?,
                synced: row.get::<_, i32>(4)? == 1,
            })
        })?;

        let mut transcripts = Vec::new();
        for transcript in transcript_iter {
            transcripts.push(transcript?);
        }
        Ok(transcripts)
    }

    pub fn mark_synced(&self, id: i32) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE transcripts SET synced = 1 WHERE id = ?1",
            params![id],
        )?;
        Ok(())
    }

    pub fn mark_all_synced(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE transcripts SET synced = 1", [])?;
        Ok(())
    }

    pub fn get_unsynced_count(&self) -> Result<i32> {
        let conn = self.conn.lock().unwrap();
        let count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM transcripts WHERE synced = 0",
            [],
            |row| row.get(0),
        )?;
        Ok(count)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transcript {
    pub id: i32,
    pub title: String,
    pub content: String,
    pub created_at: String,
    pub synced: bool,
}
