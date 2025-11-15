import { prisma } from "../index";
import { CreateSellOfferBody, UpdateSellOfferBody } from "../types";
import { NotFoundError, ConflictError } from "../errors/AppError";

export class SellOfferService {
  static async createSellOffer(data: CreateSellOfferBody) {
    try {
      const sellOffer = await prisma.sellOffer.create({
        data: {
          buy_offer_id: data.buy_offer_id,
          sell_offer_id: data.sell_offer_id,
          agent_id: data.agent_id,
          agent_address: data.agent_address,
          store_link: data.store_link,
          price: data.price,
          is_update: data.is_update,
        },
        include: {
          buyOffer: true,
          manualBuys: true,
          shopPurchases: true,
        },
      });
      return sellOffer;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new ConflictError("Sell offer with this ID already exists");
      }
      throw error;
    }
  }

  static async getSellOfferById(id: string) {
    const sellOffer = await prisma.sellOffer.findUnique({
      where: { id },
      include: {
        buyOffer: true,
        manualBuys: true,
        shopPurchases: true,
      },
    });

    if (!sellOffer) {
      throw new NotFoundError("Sell offer");
    }

    return sellOffer;
  }

  static async getSellOfferByBlockchainId(sellOfferId: string) {
    const sellOffer = await prisma.sellOffer.findUnique({
      where: { sell_offer_id: sellOfferId },
      include: {
        buyOffer: true,
        manualBuys: true,
        shopPurchases: true,
      },
    });

    if (!sellOffer) {
      throw new NotFoundError("Sell offer");
    }

    return sellOffer;
  }

  static async getSellOffersByBuyOfferId(buyOfferId: string, skip: number, take: number) {
    const [sellOffers, total] = await Promise.all([
      prisma.sellOffer.findMany({
        where: { buy_offer_id: buyOfferId },
        skip,
        take,
        include: {
          buyOffer: true,
          manualBuys: true,
          shopPurchases: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.sellOffer.count({
        where: { buy_offer_id: buyOfferId },
      }),
    ]);

    return { sellOffers, total };
  }

  static async getSellOffersByAgentId(agentId: string, skip: number, take: number) {
    const [sellOffers, total] = await Promise.all([
      prisma.sellOffer.findMany({
        where: { agent_id: agentId },
        skip,
        take,
        include: {
          buyOffer: true,
          manualBuys: true,
          shopPurchases: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.sellOffer.count({
        where: { agent_id: agentId },
      }),
    ]);

    return { sellOffers, total };
  }

  static async getAllSellOffers(skip: number, take: number) {
    const [sellOffers, total] = await Promise.all([
      prisma.sellOffer.findMany({
        skip,
        take,
        include: {
          buyOffer: true,
          manualBuys: true,
          shopPurchases: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.sellOffer.count(),
    ]);

    return { sellOffers, total };
  }

  static async updateSellOffer(id: string, data: UpdateSellOfferBody) {
    try {
      const sellOffer = await prisma.sellOffer.update({
        where: { id },
        data: {
          ...(data.store_link !== undefined && { store_link: data.store_link }),
          ...(data.price !== undefined && { price: data.price }),
          ...(data.is_update !== undefined && { is_update: data.is_update }),
        },
        include: {
          buyOffer: true,
          manualBuys: true,
          shopPurchases: true,
        },
      });
      return sellOffer;
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundError("Sell offer");
      }
      throw error;
    }
  }

  static async deleteSellOffer(id: string) {
    try {
      const sellOffer = await prisma.sellOffer.delete({
        where: { id },
      });
      return sellOffer;
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundError("Sell offer");
      }
      throw error;
    }
  }
}
