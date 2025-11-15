import { Router, Request, Response } from "express";
import { ShopPurchaseService } from "../services/shopPurchaseService";
import { validateData, shopPurchaseCreationSchema } from "../utils/validation";
import { getPaginationParams, calculatePaginationMeta } from "../utils/pagination";
import { CreateShopPurchaseBody } from "../types";

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
  const { page, limit } = req.query as { page?: string; limit?: string };
  const { skip, take } = getPaginationParams({
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  });

  const { shopPurchases, total } = await ShopPurchaseService.getAllShopPurchases(skip, take);
  const pagination = calculatePaginationMeta(total, Math.floor(skip / take) + 1, take);

  res.json({
    success: true,
    data: shopPurchases,
    pagination,
    timestamp: new Date().toISOString(),
  });
});

// Get shop purchase by ID
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
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

// Get shop purchases by sell offer ID
router.get("/sell-offer/:sellOfferId", async (req: Request, res: Response) => {
  const { sellOfferId } = req.params;
  const { page, limit } = req.query as { page?: string; limit?: string };
  const { skip, take } = getPaginationParams({
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  });

  const { shopPurchases, total } = await ShopPurchaseService.getShopPurchasesBySellOfferId(sellOfferId, skip, take);
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
  const { id } = req.params;
  const shopPurchase = await ShopPurchaseService.deleteShopPurchase(id);
  res.json({
    success: true,
    data: shopPurchase,
    timestamp: new Date().toISOString(),
  });
});

export default router;
