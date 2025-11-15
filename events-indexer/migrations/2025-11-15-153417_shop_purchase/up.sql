CREATE TABLE "ShopPurchase" (
    id SERIAL PRIMARY KEY,
    agent_id TEXT NOT NULL,
    store_link TEXT NOT NULL,
    product_price BIGINT NOT NULL,
    agent_fee BIGINT NOT NULL,
    platform_fee BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shop_purchase_agent_id ON "ShopPurchase"(agent_id);
CREATE INDEX IF NOT EXISTS idx_shop_purchase_store_link ON "ShopPurchase"(store_link);
