CREATE TABLE "ManualBuy" (
    id SERIAL PRIMARY KEY,
    buy_offer_id TEXT NOT NULL,
    buyer TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    sell_offer_id TEXT NOT NULL,
    store_link TEXT NOT NULL,
    product_price BIGINT NOT NULL,
    agent_fee BIGINT NOT NULL,
    total_paid BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_manual_buy_buy_offer_id ON "ManualBuy"(buy_offer_id);
CREATE INDEX IF NOT EXISTS idx_manual_buy_buyer ON "ManualBuy"(buyer);
CREATE INDEX IF NOT EXISTS idx_manual_buy_agent_id ON "ManualBuy"(agent_id);
CREATE INDEX IF NOT EXISTS idx_manual_buy_sell_offer_id ON "ManualBuy"(sell_offer_id);
