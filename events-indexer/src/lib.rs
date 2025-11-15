use diesel_migrations::{embed_migrations, EmbeddedMigrations};

pub mod handlers;
pub mod config;
pub mod schema;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations");
