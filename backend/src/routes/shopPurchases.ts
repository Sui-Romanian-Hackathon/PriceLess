import { Router, Request, Response } from "express";
import { prisma } from "../index";
import { ShopPurchaseService } from "../services/shopPurchaseService";
import { validateData, shopPurchaseCreationSchema } from "../utils/validation";
import { getPaginationParams, calculatePaginationMeta } from "../utils/pagination";
import { CreateShopPurchaseBody } from "../types";
import { serializeBigInt } from "../utils/bigintSerializer";

const router = Router();

// Create a new shop purchase
router.post("/", async (req: Request, res: Response) => {
  const data = validateData<CreateShopPurchaseBody>(shopPurchaseCreationSchema, req.body);
  const shopPurchase = await ShopPurchaseService.createShopPurchase(data);
  res.status(201).json({
    success: true,
    data: shopPurchase,
    timestamp: new Date().toISOString(),
  });
});

// Get all shop purchases (with pagination)
router.get("/", async (req: Request, res: Response) => {
  console.log('📦 GET /api/shop-purchases called');

  const { page, limit } = req.query as { page?: string; limit?: string };
  const { skip, take } = getPaginationParams({
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 50,
  });

  console.log(`Pagination: skip=${skip}, take=${take}`);

  // Direct query to see what's in the table
  const allRecords = await prisma.shopPurchase.findMany();
  console.log(`📊 Total ShopPurchase records in DB: ${allRecords.length}`);
  console.log(`📋 All ShopPurchase records:`, JSON.stringify(allRecords, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

  const { shopPurchases, total } = await ShopPurchaseService.getAllShopPurchases(skip, take);
  console.log(`✅ Query returned: ${shopPurchases.length} records, total: ${total}`);

  const pagination = calculatePaginationMeta(total, Math.floor(skip / take) + 1, take);

  res.json({
    success: true,
    data: serializeBigInt(shopPurchases),
    pagination,
    timestamp: new Date().toISOString(),
  });
});

// Get shop purchase by ID
router.get("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const shopPurchase = await ShopPurchaseService.getShopPurchaseById(id);
  res.json({
    success: true,
    data: shopPurchase,
    timestamp: new Date().toISOString(),
  });
});

// Get shop purchases by agent ID
router.get("/agent/:agentId", async (req: Request, res: Response) => {
  const { agentId } = req.params;
  const { page, limit } = req.query as { page?: string; limit?: string };
  const { skip, take } = getPaginationParams({
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  });

  const { shopPurchases, total } = await ShopPurchaseService.getShopPurchasesByAgentId(agentId, skip, take);
  const pagination = calculatePaginationMeta(total, Math.floor(skip / take) + 1, take);

  res.json({
    success: true,
    data: shopPurchases,
    pagination,
    timestamp: new Date().toISOString(),
  });
});

// Delete shop purchase
router.delete("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const shopPurchase = await ShopPurchaseService.deleteShopPurchase(id);
  res.json({
    success: true,
    data: shopPurchase,
    timestamp: new Date().toISOString(),
  });
});

export default router;
