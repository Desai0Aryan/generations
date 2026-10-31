import type { GameState } from './types.ts';

export const assetsValue = (s: GameState) => s.assets.reduce((a, x) => a + x.value, 0);
export const loansBalance = (s: GameState) => s.loans.reduce((a, x) => a + x.balance, 0);
export const netWorth = (s: GameState) => s.character.money + assetsValue(s) - loansBalance(s);
/** everything you owe: loans plus any negative cash balance */
export const totalDebt = (s: GameState) => loansBalance(s) + Math.max(0, -s.character.money);

/** Fixed yearly payment that retires `principal` over `years` at `rate`. */
export function amortize(principal: number, rate: number, years: number): number {
  if (rate <= 0) return Math.ceil(principal / years);
  return Math.ceil((principal * rate) / (1 - Math.pow(1 + rate, -years)));
}

/** How much total loan balance a lender will let you carry: based on income and what you already own. */
export function creditLimit(s: GameState): number {
  const income = s.character.job && !s.character.retired ? s.character.job.salary : 0;
  return Math.max(15000, Math.round(income * 4.5 + assetsValue(s) * 0.55 + Math.max(0, s.character.money) * 0.3));
}
