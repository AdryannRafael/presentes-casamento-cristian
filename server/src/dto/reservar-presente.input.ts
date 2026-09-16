import { t, type Static } from "elysia";

export const ReservarPresenteSchema = t.Object({
  presenteId: t.String(),
  nomeCompleto: t.String(),
  numero: t.String({
    pattern: "^\\(?\\d{2}\\)?\\s?9?\\d{4}-?\\d{4}$",
    default: "(98) 98888-8888",
  }),
  mensagem: t.String({maxLength: 250})
});

export type ReservarPresenteInput = Static<typeof ReservarPresenteSchema>


