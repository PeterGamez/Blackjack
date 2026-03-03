export type GameCurrency = "coins" | "tokens";

/** Solo vs AI dealer — uses coins */
export type QuickAiMode = "quick_ai";

/** 2-player vs another client — uses coins (not yet available) */
export type QuickPlayerMode = "quick_player";

/** 2-player ranked vs another client — uses tokens (not yet available) */
export type RankPlayerMode = "rank_player";

export type GameType = QuickAiMode | QuickPlayerMode | RankPlayerMode;
