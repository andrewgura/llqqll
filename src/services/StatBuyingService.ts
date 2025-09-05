import { PurchasedStats } from "@/types";

export class StatBuyingService {
  private static readonly BASE_COSTS = {
    hpRegen: { gold: 100, exp: 500 },
    mpRegen: { gold: 100, exp: 500 },
    attackSpeed: { gold: 150, exp: 750 },
    moveSpeed: { gold: 200, exp: 1000 },
  };

  private static readonly PRICE_MULTIPLIER = 1.5;

  static calculateProgressiveCost(statId: keyof PurchasedStats, purchaseCount: number) {
    const base = this.BASE_COSTS[statId];
    const multiplier = Math.pow(this.PRICE_MULTIPLIER, purchaseCount);

    return {
      gold: Math.floor(base.gold * multiplier),
      exp: Math.floor(base.exp * multiplier),
    };
  }
}
