import { z } from "zod";
import { ValidationError } from "../errors/AppError";

// Zod schemas
export const walletAddressSchema = z.string().length(66, "Invalid wallet address");

export const userCreationSchema = z.object({
  user_id: z.string().min(1, "user_id is required"),
  user_object_address: z.string().min(1, "user_object_address is required"),
  user_owner_address: walletAddressSchema,
  subscription_fee: z.coerce.bigint().min(0n),
  subscription_deadline: z.coerce.bigint().min(0n),
  timestamp: z.coerce.bigint().min(0n),
});

export const buyOfferCreationSchema = z.object({
  buy_offer_id: z.string().min(1, "buy_offer_id is required"),
  owner: walletAddressSchema,
  product: z.string().min(1, "product is required"),
  price: z.coerce.bigint().min(0n),
  offer_type_is_time_based: z.boolean(),
  deadline: z.coerce.bigint().min(0n),
  created_at: z.coerce.bigint().min(0n),
});

export const sellOfferCreationSchema = z.object({
  buy_offer_id: z.string().min(1, "buy_offer_id is required"),
  sell_offer_id: z.string().min(1, "sell_offer_id is required"),
  agent_id: z.string().min(1, "agent_id is required"),
  agent_address: walletAddressSchema,
  store_link: z.string().url("Invalid store_link URL"),
  price: z.coerce.bigint().min(0n),
  is_update: z.boolean(),
});

export const manualBuyCreationSchema = z.object({
  buy_offer_id: z.string().min(1, "buy_offer_id is required"),
  buyer: walletAddressSchema,
  agent_id: z.string().min(1, "agent_id is required"),
  sell_offer_id: z.string().min(1, "sell_offer_id is required"),
  store_link: z.string().url("Invalid store_link URL"),
  product_price: z.coerce.bigint().min(0n),
  agent_fee: z.coerce.bigint().min(0n),
  total_paid: z.coerce.bigint().min(0n),
});

export const shopPurchaseCreationSchema = z.object({
  agent_id: z.string().min(1, "agent_id is required"),
  sell_offer_id: z.string().min(1, "sell_offer_id is required"),
  store_link: z.string().url("Invalid store_link URL"),
  product_price: z.coerce.bigint().min(0n),
  agent_fee: z.coerce.bigint().min(0n),
  platform_fee: z.coerce.bigint().min(0n),
});

// Validation function
export function validateData<T>(schema: z.ZodSchema, data: unknown): T {
  try {
    return schema.parse(data) as T;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
      throw new ValidationError(messages.join(", "));
    }
    throw error;
  }
}
