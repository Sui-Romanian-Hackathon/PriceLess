import { Router, Request, Response } from "express";
import { ManualBuyService } from "../services/manualBuyService";
import { validateData, manualBuyCreationSchema } from "../utils/validation";
import { getPaginationParams, calculatePaginationMeta } from "../utils/pagination";
import { CreateManualBuyBody } from "../types";

const router = Router();

// Create a new manual buy
router.post("/", async (req: Request, res: Response) => {
  const data = validateData<CreateManualBuyBody>(manualBuyCreationSchema, req.body);
  const manualBuy = await ManualBuyService.createManualBuy(data);
  res.status(201).json({
    success: true,
    data: manualBuy,
    timestamp: new Date().toISOString(),
  });
});

// Get all manual buys (with pagination)
router.get("/", async (req: Request, res: Response) => {
  const { page, limit } = req.query as { page?: string; limit?: string };
  const { skip, take } = getPaginationParams({
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  });

  const { manualBuys, total } = await ManualBuyService.getAllManualBuys(skip, take);
  const pagination = calculatePaginationMeta(total, Math.floor(skip / take) + 1, take);

  res.json({
    success: true,
    data: manualBuys,
    pagination,
    timestamp: new Date().toISOString(),
  });
});

// Get manual buy by ID
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const manualBuy = await ManualBuyService.getManualBuyById(id);
  res.json({
    success: true,
    data: manualBuy,
    timestamp: new Date().toISOString(),
  });
});

// Get manual buys by buyer
router.get("/buyer/:buyer", async (req: Request, res: Response) => {
  const { buyer } = req.params;
  const { page, limit } = req.query as { page?: string; limit?: string };
  const { skip, take } = getPaginationParams({
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  });

  const { manualBuys, total } = await ManualBuyService.getManualBuysByBuyer(buyer, skip, take);
  const pagination = calculatePaginationMeta(total, Math.floor(skip / take) + 1, take);

  res.json({
    success: true,
    data: manualBuys,
    pagination,
    timestamp: new Date().toISOString(),
  });
});

// Get manual buys by agent ID
router.get("/agent/:agentId", async (req: Request, res: Response) => {
  const { agentId } = req.params;
  const { page, limit } = req.query as { page?: string; limit?: string };
  const { skip, take } = getPaginationParams({
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  });

  const { manualBuys, total } = await ManualBuyService.getManualBuysByAgentId(agentId, skip, take);
  const pagination = calculatePaginationMeta(total, Math.floor(skip / take) + 1, take);

  res.json({
    success: true,
    data: manualBuys,
    pagination,
    timestamp: new Date().toISOString(),
  });
});

// Get manual buys by buy offer ID
router.get("/buy-offer/:buyOfferId", async (req: Request, res: Response) => {
  const { buyOfferId } = req.params;
  const { page, limit } = req.query as { page?: string; limit?: string };
  const { skip, take } = getPaginationParams({
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  });

  const { manualBuys, total } = await ManualBuyService.getManualBuysByBuyOfferId(buyOfferId, skip, take);
  const pagination = calculatePaginationMeta(total, Math.floor(skip / take) + 1, take);

  res.json({
    success: true,
    data: manualBuys,
    pagination,
    timestamp: new Date().toISOString(),
  });
});

// Delete manual buy
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const manualBuy = await ManualBuyService.deleteManualBuy(id);
  res.json({
    success: true,
    data: manualBuy,
    timestamp: new Date().toISOString(),
  });
});

export default router;
