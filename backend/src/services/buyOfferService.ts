import { prisma } from "../index";
import { CreateBuyOfferBody, UpdateBuyOfferBody } from "../types";
import { NotFoundError, ConflictError } from "../errors/AppError";

export class BuyOfferService {
  static async createBuyOffer(data: CreateBuyOfferBody) {
    try {
      const buyOffer = await prisma.buyOffer.create({
        data: {
          buy_offer_id: data.buy_offer_id,
          owner: data.owner,
          product: data.product,
          price: data.price,
          offer_type_is_time_based: data.offer_type_is_time_based,
          deadline: data.deadline,
          created_at: data.created_at,
        },
        include: {
          user: true,
          sellOffers: true,
        },
      });
      return buyOffer;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new ConflictError("Buy offer with this ID already exists");
      }
      throw error;
    }
  }

  static async getBuyOfferById(id: number) {
    const buyOffer = await prisma.buyOffer.findUnique({
      where: { id },
      include: {
        user: true,
        sellOffers: true,
        manualBuys: true,
      },
    });

    if (!buyOffer) {
      throw new NotFoundError("Buy offer");
    }

    return buyOffer;
  }

  static async getBuyOfferByBlockchainId(buyOfferId: string) {
    const buyOffer = await prisma.buyOffer.findUnique({
      where: { buy_offer_id: buyOfferId },
      include: {
        user: true,
        sellOffers: true,
        manualBuys: true,
      },
    });

    if (!buyOffer) {
      throw new NotFoundError("Buy offer");
    }

    return buyOffer;
  }

  static async getBuyOffersByOwner(ownerAddress: string, skip: number, take: number) {
    const [buyOffers, total] = await Promise.all([
      prisma.buyOffer.findMany({
        where: { owner: ownerAddress },
        skip,
        take,
        include: {
          user: true,
          sellOffers: true,
        },
      }),
      prisma.buyOffer.count({
        where: { owner: ownerAddress },
      }),
    ]);

    return { buyOffers, total };
  }

  static async getAllBuyOffers(skip: number, take: number) {
    const [buyOffers, total] = await Promise.all([
      prisma.buyOffer.findMany({
        skip,
        take,
        include: {
          user: true,
          sellOffers: true,
        },
      }),
      prisma.buyOffer.count(),
    ]);

    return { buyOffers, total };
  }

  static async getBuyOffersByDeadline(beforeDeadline: bigint, skip: number, take: number) {
    const [buyOffers, total] = await Promise.all([
      prisma.buyOffer.findMany({
        where: { deadline: { gte: beforeDeadline } },
        skip,
        take,
        include: {
          user: true,
          sellOffers: true,
        },
        orderBy: { deadline: "asc" },
      }),
      prisma.buyOffer.count({
        where: { deadline: { gte: beforeDeadline } },
      }),
    ]);

    return { buyOffers, total };
  }

  static async updateBuyOffer(id: number, data: UpdateBuyOfferBody) {
    try {
      const buyOffer = await prisma.buyOffer.update({
        where: { id },
        data: {
          ...(data.product !== undefined && { product: data.product }),
          ...(data.price !== undefined && { price: data.price }),
          ...(data.deadline !== undefined && { deadline: data.deadline }),
        },
        include: {
          user: true,
          sellOffers: true,
        },
      });
      return buyOffer;
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundError("Buy offer");
      }
      throw error;
    }
  }

  static async deleteBuyOffer(id: number) {
    try {
      const buyOffer = await prisma.buyOffer.delete({
        where: { id },
      });
      return buyOffer;
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundError("Buy offer");
      }
      throw error;
    }
  }
}
