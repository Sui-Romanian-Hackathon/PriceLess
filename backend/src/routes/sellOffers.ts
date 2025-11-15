import { Router, Request, Response } from "express";
import { SellOfferService } from "../services/sellOfferService";
import { validateData, sellOfferCreationSchema } from "../utils/validation";
import { getPaginationParams, calculatePaginationMeta } from "../utils/pagination";
import { CreateSellOfferBody, UpdateSellOfferBody } from "../types";

const router = Router();

// Create a new sell offer
router.post("/", async (req: Request, res: Response) => {
  const data = validateData<CreateSellOfferBody>(sellOfferCreationSchema, req.body);
  const sellOffer = await SellOfferService.createSellOffer(data);
  res.status(201).json({
    success: true,
    data: sellOffer,
    timestamp: new Date().toISOString(),
  });
});

// Get all sell offers (with pagination)
router.get("/", async (req: Request, res: Response) => {
  const { page, limit } = req.query as { page?: string; limit?: string };
  const { skip, take } = getPaginationParams({
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  });

  const { sellOffers, total } = await SellOfferService.getAllSellOffers(skip, take);
  const pagination = calculatePaginationMeta(total, Math.floor(skip / take) + 1, take);

  res.json({
    success: true,
    data: sellOffers,
    pagination,
    timestamp: new Date().toISOString(),
  });
});

// Get sell offer by ID
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const sellOffer = await SellOfferService.getSellOfferById(id);
  res.json({
    success: true,
    data: sellOffer,
    timestamp: new Date().toISOString(),
  });
});

// Get sell offer by blockchain ID
router.get("/blockchain/:sellOfferId", async (req: Request, res: Response) => {
  const { sellOfferId } = req.params;
  const sellOffer = await SellOfferService.getSellOfferByBlockchainId(sellOfferId);
  res.json({
    success: true,
    data: sellOffer,
    timestamp: new Date().toISOString(),
  });
});

// Get sell offers by buy offer ID
router.get("/buy-offer/:buyOfferId", async (req: Request, res: Response) => {
  const { buyOfferId } = req.params;
  const { page, limit } = req.query as { page?: string; limit?: string };
  const { skip, take } = getPaginationParams({
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  });

  const { sellOffers, total } = await SellOfferService.getSellOffersByBuyOfferId(buyOfferId, skip, take);
  const pagination = calculatePaginationMeta(total, Math.floor(skip / take) + 1, take);

  res.json({
    success: true,
    data: sellOffers,
    pagination,
    timestamp: new Date().toISOString(),
  });
});

// Get sell offers by agent ID
router.get("/agent/:agentId", async (req: Request, res: Response) => {
  const { agentId } = req.params;
  const { page, limit } = req.query as { page?: string; limit?: string };
  const { skip, take } = getPaginationParams({
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  });

  const { sellOffers, total } = await SellOfferService.getSellOffersByAgentId(agentId, skip, take);
  const pagination = calculatePaginationMeta(total, Math.floor(skip / take) + 1, take);

  res.json({
    success: true,
    data: sellOffers,
    pagination,
    timestamp: new Date().toISOString(),
  });
});

// Update sell offer
router.patch("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body as UpdateSellOfferBody;
  const sellOffer = await SellOfferService.updateSellOffer(id, data);
  res.json({
    success: true,
    data: sellOffer,
    timestamp: new Date().toISOString(),
  });
});

// Delete sell offer
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const sellOffer = await SellOfferService.deleteSellOffer(id);
  res.json({
    success: true,
    data: sellOffer,
    timestamp: new Date().toISOString(),
  });
});

export default router;
