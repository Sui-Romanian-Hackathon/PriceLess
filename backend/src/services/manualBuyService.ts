import { prisma } from "../index";
import { CreateManualBuyBody } from "../types";
import { NotFoundError } from "../errors/AppError";

export class ManualBuyService {
  static async createManualBuy(data: CreateManualBuyBody) {
    const manualBuy = await prisma.manualBuy.create({
      data: {
        buy_offer_id: data.buy_offer_id,
        buyer: data.buyer,
        agent_id: data.agent_id,
        sell_offer_id: data.sell_offer_id,
        store_link: data.store_link,
        product_price: data.product_price,
        agent_fee: data.agent_fee,
        total_paid: data.total_paid,
      },
      include: {
        user: true,
        buyOffer: true,
        sellOffer: true,
      },
    });
    return manualBuy;
  }

  static async getManualBuyById(id: string) {
    const manualBuy = await prisma.manualBuy.findUnique({
      where: { id },
      include: {
        user: true,
        buyOffer: true,
        sellOffer: true,
      },
    });

    if (!manualBuy) {
      throw new NotFoundError("Manual buy");
    }

    return manualBuy;
  }

  static async getManualBuysByBuyer(buyer: string, skip: number, take: number) {
    const [manualBuys, total] = await Promise.all([
      prisma.manualBuy.findMany({
        where: { buyer },
        skip,
        take,
        include: {
          user: true,
          buyOffer: true,
          sellOffer: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.manualBuy.count({
        where: { buyer },
      }),
    ]);

    return { manualBuys, total };
  }

  static async getManualBuysByAgentId(agentId: string, skip: number, take: number) {
    const [manualBuys, total] = await Promise.all([
      prisma.manualBuy.findMany({
        where: { agent_id: agentId },
        skip,
        take,
        include: {
          user: true,
          buyOffer: true,
          sellOffer: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.manualBuy.count({
        where: { agent_id: agentId },
      }),
    ]);

    return { manualBuys, total };
  }

  static async getManualBuysByBuyOfferId(buyOfferId: string, skip: number, take: number) {
    const [manualBuys, total] = await Promise.all([
      prisma.manualBuy.findMany({
        where: { buy_offer_id: buyOfferId },
        skip,
        take,
        include: {
          user: true,
          buyOffer: true,
          sellOffer: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.manualBuy.count({
        where: { buy_offer_id: buyOfferId },
      }),
    ]);

    return { manualBuys, total };
  }

  static async getAllManualBuys(skip: number, take: number) {
    const [manualBuys, total] = await Promise.all([
      prisma.manualBuy.findMany({
        skip,
        take,
        include: {
          user: true,
          buyOffer: true,
          sellOffer: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.manualBuy.count(),
    ]);

    return { manualBuys, total };
  }

  static async deleteManualBuy(id: string) {
    try {
      const manualBuy = await prisma.manualBuy.delete({
        where: { id },
      });
      return manualBuy;
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundError("Manual buy");
      }
      throw error;
    }
  }
}
