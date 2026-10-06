export type Competitor = Readonly<{
  name: string;
  rating: number;
  division: string;
  wins: number;
  losses: number;
}>;

export const localOpponent: Competitor = {
  name: 'MASON', rating: 1511, division: 'SILVER II', wins: 31, losses: 22,
};
