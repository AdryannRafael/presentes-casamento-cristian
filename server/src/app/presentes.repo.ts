import { eq, count } from "drizzle-orm";
import { convidado, presente, PresenteModel, user, UserModel } from "../infra/db/schema/public";
import { E } from "../shared/either";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

export function PresenteRepo(db: NodePgDatabase) {
  return {
    async FindUserByNumero(numero: string): E.R<UserModel | null> {
      const query = db.select().from(user).where(eq(user.numero, numero));
      return GetByOrNull(query);
    },
    async FindPresenteById(id: string): E.R<PresenteModel | null> {
      const query = db.select().from(presente).where(eq(presente.id, id));
      return GetByOrNull(query);
    },
    async CountReservaByPresenteId(id: string): E.R<number> {
      const { err, v } = await E.Db(db.select({ count: count() }).from(convidado).where(eq(convidado.presenteId, id)));
      if (err) return E.Fail(err);

      return E.Ok(v[0].count);
    },
  };
}

export async function GetByOrNull<T>(query: { limit: (l: number) => Promise<T[]> }): E.R<T | null> {
  const { err, v } = await E.Db(query.limit(1));
  if (err) return E.Fail(err);
  if (!v || !v.length) {
    return E.Ok(null);
  }
  return E.Ok(v[0]);
}
