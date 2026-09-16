import { ListarPresentes, ReservarPresente } from "@/src/app/presentes.usecase";
import Elysia from "elysia";
import { PresentsSchema } from "../../dto/presentes.out";
import { ReservarPresenteSchema } from "../../dto/reservar-presente.input";

export const presentesController = new Elysia({
  name: "hello",
  prefix: "/presentes",
})
  // ROTA PARA LISTAR TODOS OS PRESENTES
  .get(
    "",
    async () => {
      const { err, v } = await ListarPresentes();
      if (err) throw err;
      return v;
    },
    { response: PresentsSchema },
  )
  // ROTA PARA RESERVAR UM PRESENTE
  .post(
    "/reservar",
    async ({ body }) => {
      const { err, v } = await ReservarPresente(body);
      if (err) throw err;
      return v;
    },
    { body: ReservarPresenteSchema },
  );
