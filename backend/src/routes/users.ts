import { Router, Request, Response } from "express";
import { UserService } from "../services/userService";
import { ValidationError } from "../errors/AppError";
import { serializeBigInt } from "../utils/bigintSerializer";

const router = Router();

// Get user by connected wallet address (user_owner_address)
router.get("/", async (req: Request, res: Response) => {
  const { address } = req.query as { address?: string };

  if (!address) {
    throw new ValidationError("address query parameter is required");
  }

  const user = await UserService.getUserByOwnerAddress(address);
  res.json({
    success: true,
    data: serializeBigInt(user),
    timestamp: new Date().toISOString(),
  });
});

export default router;
