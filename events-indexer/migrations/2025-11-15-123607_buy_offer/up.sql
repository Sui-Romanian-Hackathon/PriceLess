CREATE TABLE "BuyOffer" (
    id SERIAL PRIMARY KEY,
    buy_offer_id TEXT NOT NULL,
    owner TEXT NOT NULL,
    product TEXT NOT NULL,
    price BIGINT NOT NULL,
    offer_type_is_time_based BOOLEAN NOT NULL,
    deadline BIGINT NOT NULL,
    created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_buy_offer_id ON "BuyOffer"(buy_offer_id);
CREATE INDEX IF NOT EXISTS idx_buy_offer_owner ON "BuyOffer"(owner);
CREATE INDEX IF NOT EXISTS idx_buy_offer_product ON "BuyOffer"(product);
