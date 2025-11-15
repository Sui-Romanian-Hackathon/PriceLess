CREATE TABLE "Agent" (
    id SERIAL PRIMARY KEY,
    agent_id TEXT NOT NULL,
    agent_address TEXT NOT NULL,
    agent_owner_address TEXT NOT NULL,
    stake_amount BIGINT NOT NULL,
    rating BIGINT NOT NULL,
    buys BIGINT NOT NULL,
    active BOOLEAN NOT NULL,
    registered_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_agent_id ON "Agent"(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_agent_address ON "Agent"(agent_address);
CREATE INDEX IF NOT EXISTS idx_agent_agent_owner_address ON "Agent"(agent_owner_address);
