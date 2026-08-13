import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const demolitionPlayers = sqliteTable("demolition_players", {
  id: text("id").primaryKey(),
  bestScore: integer("best_score").notNull().default(0),
  clears: integer("clears").notNull().default(0),
  totalDestroyed: integer("total_destroyed").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const demolitionSaves = sqliteTable("demolition_saves", {
  playerId: text("player_id").primaryKey().references(() => demolitionPlayers.id),
  xp: integer("xp").notNull().default(0),
  score: integer("score").notNull().default(0),
  destroyed: integer("destroyed").notNull().default(0),
  maxCombo: integer("max_combo").notNull().default(0),
  playSeconds: real("play_seconds").notNull().default(0),
  cleared: integer("cleared", { mode: "boolean" }).notNull().default(false),
  destroyedJson: text("destroyed_json").notNull().default("[]"),
  completedGoalsJson: text("completed_goals_json").notNull().default("[]"),
  updatedAt: text("updated_at").notNull(),
});

export const demolitionRuns = sqliteTable("demolition_runs", {
  id: text("id").primaryKey(),
  playerId: text("player_id").notNull().references(() => demolitionPlayers.id),
  score: integer("score").notNull(),
  destroyed: integer("destroyed").notNull(),
  maxCombo: integer("max_combo").notNull(),
  playSeconds: real("play_seconds").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("demolition_runs_player_created_idx").on(table.playerId, table.createdAt),
  index("demolition_runs_score_idx").on(table.score),
]);
