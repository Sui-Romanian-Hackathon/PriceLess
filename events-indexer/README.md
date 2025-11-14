# Events Indexer

Sui Indexer for Agent Registration events using the [sui-indexer-alt](https://github.com/MystenLabs/sui/tree/main/crates/sui-indexer-alt) framework.

## Setup

### Prerequisites

- Rust toolchain
- PostgreSQL database
- Diesel CLI

Install Diesel CLI:

```sh
cargo install diesel_cli --no-default-features --features postgres
```

### Database Setup

1. Configure your database connection in `.env`:

```sh
DATABASE_URL=postgresql://username:password@localhost:5432/events-indexer
```

2. Run migrations:

```sh
diesel setup --migration-dir migrations 
diesel migration run --migration-dir migrations
```

## Running the Indexer

### Testnet

```sh
RUST_LOG=info cargo run -- \
  --remote-store-url https://checkpoints.testnet.sui.io \
  --network testnet
```

### Release Mode

Use release mode for better performance:

```sh
RUST_LOG=info cargo run --release -- \
  --remote-store-url https://checkpoints.testnet.sui.io \
  --first-checkpoint 0 \
  --network testnet
```
 
 ### Reset database
# Reset the database (drops, recreates, and runs all migrations)
```sh
diesel database reset
```

# If you need to update the schema after migrations run
```sh
diesel print-schema > src/schema.rs
```