import { prisma } from "../index";
import { CreateShopPurchaseBody } from "../types";
import { NotFoundError } from "../errors/AppError";

export class ShopPurchaseService {
  static async createShopPurchase(data: CreateShopPurchaseBody) {
    const shopPurchase = await prisma.shopPurchase.create({
      data: {
        agent_id: data.agent_id,
        store_link: data.store_link,
        product_price: data.product_price,
        agent_fee: data.agent_fee,
        platform_fee: data.platform_fee,
      },
    });
    return shopPurchase;
  }

  static async getShopPurchaseById(id: number) {
    const shopPurchase = await prisma.shopPurchase.findUnique({
      where: { id },
    });

    if (!shopPurchase) {
      throw new NotFoundError("Shop purchase");
    }

    return shopPurchase;
  }

  static async getShopPurchasesByAgentId(agentId: string, skip: number, take: number) {
    const [shopPurchases, total] = await Promise.all([
      prisma.shopPurchase.findMany({
        where: { agent_id: agentId },
        skip,
        take,
      }),
      prisma.shopPurchase.count({
        where: { agent_id: agentId },
      }),
    ]);

    return { shopPurchases, total };
  }

  static async getAllShopPurchases(skip: number, take: number) {
    const [shopPurchases, total] = await Promise.all([
      prisma.shopPurchase.findMany({
        skip,
        take,
      }),
      prisma.shopPurchase.count(),
    ]);

    return { shopPurchases, total };
  }

  static async deleteShopPurchase(id: number) {
    try {
      const shopPurchase = await prisma.shopPurchase.delete({
        where: { id },
      });
      return shopPurchase;
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundError("Shop purchase");
      }
      throw error;
    }
  }
}
