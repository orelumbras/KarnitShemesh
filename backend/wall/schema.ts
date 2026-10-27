import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
export const notes=sqliteTable('wall_notes',{
 seq:integer('seq').primaryKey({autoIncrement:true}),
 id:text('id').notNull().unique(),
 author:text('author').notNull(),
 body:text('body').notNull(),
 color:text('color').notNull(),
 createdAt:text('created_at').notNull()
});
