import { prisma } from "../index";
import { CreateUserBody, UpdateUserBody } from "../types";
import { NotFoundError, ConflictError } from "../errors/AppError";

export class UserService {
  static async createUser(data: CreateUserBody) {
    try {
      const user = await prisma.user.create({
        data: {
          user_id: data.user_id,
          user_address: data.user_address,
          user_owner_address: data.user_owner_address,
          subscription_fee: data.subscription_fee,
          subscription_deadline: data.subscription_deadline,
          active: data.active,
          registered_at: data.registered_at,
        },
      });
      return user;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new ConflictError("User with this wallet address already exists");
      }
      throw error;
    }
  }

  static async getUserById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        buyOffers: true,
        manualBuys: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User");
    }

    return user;
  }

  static async getUserByOwnerAddress(userOwnerAddress: string) {
    const user = await prisma.user.findUnique({
      where: { user_owner_address: userOwnerAddress },
      include: {
        buyOffers: true,
        manualBuys: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User");
    }

    return user;
  }

  static async getAllUsers(skip: number, take: number) {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take,
        include: {
          buyOffers: true,
          manualBuys: true,
        },
        orderBy: { registered_at: "desc" },
      }),
      prisma.user.count(),
    ]);

    return { users, total };
  }

  static async updateUser(id: number, data: UpdateUserBody) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(data.subscription_fee !== undefined && {
            subscription_fee: data.subscription_fee,
          }),
          ...(data.subscription_deadline !== undefined && {
            subscription_deadline: data.subscription_deadline,
          }),
        },
        include: {
          buyOffers: true,
          manualBuys: true,
        },
      });
      return user;
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundError("User");
      }
      throw error;
    }
  }

  static async deleteUser(id: number) {
    try {
      const user = await prisma.user.delete({
        where: { id },
      });
      return user;
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new NotFoundError("User");
      }
      throw error;
    }
  }
}
