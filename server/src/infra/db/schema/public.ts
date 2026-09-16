import { randomUUIDv7 } from "bun";
import {
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
  pgSchema,
  pgTable,
  numeric,
  varchar,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

// export const authSchema = pgSchema("auth");

export const presente = pgTable("presente", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUIDv7()),
  titulo: varchar("name", { length: 250 }).notNull(),
  category: varchar("category", { length: 250 }).notNull(),
  price: numeric("price").notNull(),
  image: text("image").notNull(),
  total: numeric("quantidade_total").notNull(),
  reserva: numeric("quantidade_reservada").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
export type PresenteModel = InferSelectModel<typeof presente>;

export const user = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUIDv7()),
  name: text("name").notNull(),
  numero: text("numero").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
export type UserModel = InferSelectModel<typeof user>;

export const convidado = pgTable("convidado", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUIDv7()),
  messagem: varchar("messagem", { length: 250 }).notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  presenteId: text("presente_id")
    .notNull()
    .references(() => presente.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
export type ConvidadoModel = InferSelectModel<typeof convidado>;

// export const session = authSchema.table(
//   "session",
//   {
//     id: text("id").primaryKey().$defaultFn(() => randomUUIDv7()),
//     expiresAt: timestamp("expires_at").notNull(),
//     token: text("token").notNull().unique(),
//     createdAt: timestamp("created_at").notNull(),
//     updatedAt: timestamp("updated_at")
//       .$onUpdate(() => new Date())
//       .notNull(),
//     ipAddress: text("ip_address"),
//     userAgent: text("user_agent"),
//     userId: text("user_id")
//       .notNull()
//       .references(() => user.id, { onDelete: "cascade" }),
//   },
//   (table) => [index("session_userId_idx").on(table.userId)],
// );

// export const account = authSchema.table(
//   "account",
//   {
//     id: text("id").primaryKey().$defaultFn(() => randomUUIDv7()),
//     issuer: text("issuer").notNull(),
//     accountId: text("account_id").notNull(),
//     providerId: text("provider_id").notNull(),
//     userId: text("user_id")
//       .notNull()
//       .references(() => user.id, { onDelete: "cascade" }),
//     accessToken: text("access_token"),
//     refreshToken: text("refresh_token"),
//     idToken: text("id_token"),
//     accessTokenExpiresAt: timestamp("access_token_expires_at"),
//     refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
//     scope: text("scope"),
//     password: text("password"),
//     createdAt: timestamp("created_at").notNull(),
//     updatedAt: timestamp("updated_at")
//       .$onUpdate(() => new Date())
//       .notNull(),
//   },
//   (table) => [
//     uniqueIndex("account_issuer_accountId_uidx").on(
//       table.issuer,
//       table.accountId,
//     ),
//     index("account_userId_idx").on(table.userId),
//   ],
// );

// export const verification = authSchema.table(
//   "verification",
//   {
//     id: text("id").primaryKey().$defaultFn(() => randomUUIDv7()),
//     identifier: text("identifier").notNull(),
//     value: text("value").notNull(),
//     expiresAt: timestamp("expires_at").notNull(),
//     createdAt: timestamp("created_at").notNull(),
//     updatedAt: timestamp("updated_at")
//       .$onUpdate(() => new Date())
//       .notNull(),
//   },
//   (table) => [index("verification_identifier_idx").on(table.identifier)],
// );
