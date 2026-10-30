import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';
export const notes=sqliteTable('wall_notes',{
 seq:integer('seq').primaryKey({autoIncrement:true}),
 id:text('id').notNull().unique(),
 author:text('author').notNull(),
 body:text('body').notNull(),
 color:text('color').notNull(),
 createdAt:text('created_at').notNull()
});

// Run tickets and computed scores are separate so a retry cannot replace a score.
export const arcadeRuns=sqliteTable('arcade_runs',{
 runId:text('run_id').primaryKey(),
 seed:integer('seed').notNull(),
 version:text('version').notNull(),
 clientHash:text('client_hash').notNull(),
 createdAt:integer('created_at').notNull()
},table=>[index('arcade_runs_client_created').on(table.clientHash,table.createdAt),index('arcade_runs_created').on(table.createdAt)]);

export const arcadeScores=sqliteTable('arcade_scores',{
 runId:text('run_id').primaryKey(),
 name:text('name').notNull(),
 nameKey:text('name_key').notNull(),
 score:integer('score').notNull(),
 level:integer('level').notNull(),
 deliveries:integer('deliveries').notNull(),
 totalCollected:integer('total_collected').notNull(),
 ticks:integer('ticks').notNull(),
 replayHash:text('replay_hash').notNull(),
 createdAt:text('created_at').notNull()
},table=>[index('arcade_scores_ranking').on(table.score,table.createdAt),index('arcade_scores_created').on(table.createdAt),index('arcade_scores_name').on(table.nameKey)]);
