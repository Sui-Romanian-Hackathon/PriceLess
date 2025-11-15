CREATE TABLE "User" (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_address TEXT NOT NULL,
    user_owner_address TEXT NOT NULL,
    subscription_fee BIGINT NOT NULL,
    subscription_deadline BIGINT NOT NULL,
    active BOOLEAN NOT NULL,
    registered_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_user_id ON "User"(user_id);
CREATE INDEX IF NOT EXISTS idx_user_user_address ON "User"(user_address);
CREATE INDEX IF NOT EXISTS idx_user_user_owner_address ON "User"(user_owner_address);
