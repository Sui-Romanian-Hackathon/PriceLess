import { Router, Request, Response } from "express";
import { BuyOfferService } from "../services/buyOfferService";
import { validateData, buyOfferCreationSchema } from "../utils/validation";
import { getPaginationParams, calculatePaginationMeta } from "../utils/pagination";
import { CreateBuyOfferBody, UpdateBuyOfferBody } from "../types";

const router = Router();

// Create a new buy offer
router.post("/", async (req: Request, res: Response) => {
  const data = validateData<CreateBuyOfferBody>(buyOfferCreationSchema, req.body);
  const buyOffer = await BuyOfferService.createBuyOffer(data);
  res.status(201).json({
    success: true,
    data: buyOffer,
    timestamp: new Date().toISOString(),
  });
});

// Get all buy offers (with pagination)
router.get("/", async (req: Request, res: Response) => {
  const { page, limit } = req.query as { page?: string; limit?: string };
  const { skip, take } = getPaginationParams({
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  });

  const { buyOffers, total } = await BuyOfferService.getAllBuyOffers(skip, take);
  const pagination = calculatePaginationMeta(total, Math.floor(skip / take) + 1, take);

  res.json({
    success: true,
    data: buyOffers,
    pagination,
    timestamp: new Date().toISOString(),
  });
});

// Get buy offer by ID
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const buyOffer = await BuyOfferService.getBuyOfferById(id);
  res.json({
    success: true,
    data: buyOffer,
    timestamp: new Date().toISOString(),
  });
});

// Get buy offer by blockchain ID
router.get("/blockchain/:buyOfferId", async (req: Request, res: Response) => {
  const { buyOfferId } = req.params;
  const buyOffer = await BuyOfferService.getBuyOfferByBlockchainId(buyOfferId);
  res.json({
    success: true,
    data: buyOffer,
    timestamp: new Date().toISOString(),
  });
});

// Get buy offers by owner
router.get("/owner/:ownerAddress", async (req: Request, res: Response) => {
  const { ownerAddress } = req.params;
  const { page, limit } = req.query as { page?: string; limit?: string };
  const { skip, take } = getPaginationParams({
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  });

  const { buyOffers, total } = await BuyOfferService.getBuyOffersByOwner(ownerAddress, skip, take);
  const pagination = calculatePaginationMeta(total, Math.floor(skip / take) + 1, take);

  res.json({
    success: true,
    data: buyOffers,
    pagination,
    timestamp: new Date().toISOString(),
  });
});

// Get active buy offers (by deadline)
router.get("/active/deadline", async (req: Request, res: Response) => {
  const { page, limit } = req.query as { page?: string; limit?: string };
  const { skip, take } = getPaginationParams({
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined,
  });

  const now = BigInt(Math.floor(Date.now() / 1000));
  const { buyOffers, total } = await BuyOfferService.getBuyOffersByDeadline(now, skip, take);
  const pagination = calculatePaginationMeta(total, Math.floor(skip / take) + 1, take);

  res.json({
    success: true,
    data: buyOffers,
    pagination,
    timestamp: new Date().toISOString(),
  });
});

// Update buy offer
router.patch("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body as UpdateBuyOfferBody;
  const buyOffer = await BuyOfferService.updateBuyOffer(id, data);
  res.json({
    success: true,
    data: buyOffer,
    timestamp: new Date().toISOString(),
  });
});

// Delete buy offer
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const buyOffer = await BuyOfferService.deleteBuyOffer(id);
  res.json({
    success: true,
    data: buyOffer,
    timestamp: new Date().toISOString(),
  });
});

export default router;
