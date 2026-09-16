import { Static, t } from "elysia";

export const PresentsSchema = t.Array(t.Object({
  id: t.String(),
  titulo: t.String(),
  categoria: t.String(),
  preco: t.Number(),
  imagemUrl: t.String(),
  quantidadeTotal: t.Integer(),
  quantidadeReservada: t.Integer(),
}));

export type PresentsOutput = Static<typeof PresentsSchema>;
