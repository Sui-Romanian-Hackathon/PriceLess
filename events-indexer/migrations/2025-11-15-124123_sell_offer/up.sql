CREATE TABLE "SellOffer" (
    id SERIAL PRIMARY KEY,
    buy_offer_id TEXT NOT NULL,
    sell_offer_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    agent_address TEXT NOT NULL,
    store_link TEXT NOT NULL,
    price BIGINT NOT NULL,
    is_update BOOLEAN NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sell_offer_id ON "SellOffer"(sell_offer_id);
CREATE INDEX IF NOT EXISTS idx_sell_offer_buy_offer_id ON "SellOffer"(buy_offer_id);
CREATE INDEX IF NOT EXISTS idx_sell_offer_agent_id ON "SellOffer"(agent_id);
CREATE INDEX IF NOT EXISTS idx_sell_offer_agent_address ON "SellOffer"(agent_address);
