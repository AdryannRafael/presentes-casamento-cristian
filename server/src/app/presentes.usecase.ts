import { db } from "@/src/infra/db";
import { convidado, presente, user, UserModel } from "@/src/infra/db/schema/public";
import { pipeline } from "node:stream/promises";
import { E } from "../shared/either";
import { NegotiateException } from "../shared/error/exceptions";
import { ReservarPresenteInput } from "../dto/reservar-presente.input";
import { PresentsOutput } from "../dto/presentes.out";
import { count, eq, sql } from "drizzle-orm";
import { presentes } from "@/presentes_corrigido";
import { PresenteRepo } from "./presentes.repo";

export async function Migrate() {
  await pipeline(Readable, Writable);
}

async function* Readable() {
  yield* presentes;
}

async function* Writable(
  stream: AsyncGenerator<{
    id: number;
    titulo: string;
    categoria: string;
    preco: number;
    imagemUrl: string;
    quantidadeTotal: number;
    quantidadeReservada: number;
  }>,
) {
  for await (const data of stream) {
    await db
      .insert(presente)
      .values({
        titulo: data.titulo,
        category: data.categoria,
        price: String(data.preco),
        image: data.imagemUrl,
        total: String(data.quantidadeTotal),
        reserva: String(data.quantidadeReservada),
      })
      .returning();
  }
}

export async function ListarPresentes(): E.R<PresentsOutput> {
  const { err, v: presentes } = await E.Db(db.select().from(presente));
  if (err) return E.Fail(err);

  let dto: PresentsOutput = [];
  for (let p of presentes) {
    const { err: erroBuscaQuatidade, v: quantidadeReservado } = await E.Db(
      db.select({ count: count() }).from(convidado).where(eq(convidado.presenteId, p.id)),
    );
    // if (erroBuscaQuatidade) return E.Fail(erroBuscaQuatidade);
    dto.push({
      id: p.id,
      categoria: p.category,
      imagemUrl: p.image,
      preco: +p.price,
      titulo: p.titulo,
      quantidadeTotal: +p.total,
      quantidadeReservada: quantidadeReservado ? quantidadeReservado[0].count : 0,
    });
  }
  return E.Ok(dto);
}

export async function ReservarPresente(dto: ReservarPresenteInput): E.R<boolean> {
  const repo = PresenteRepo(db);
  const numeroLimpo = SanitizarNumero(dto.numero);
  if (numeroLimpo.length < 9) {
    return E.Fail(new NegotiateException("Insira um número valido", "validation"));
  }
  /**Procurando o presente a ser reservado */
  const { err: errPresente, v: presenteEncontrado } = await repo.FindPresenteById(dto.presenteId);
  if (errPresente) return E.Fail(errPresente);

  if (!presenteEncontrado) {
    return E.Fail(new NegotiateException("Presente não encontrado", "rule_businnes"));
  }

  /**Validando se esse presente ja esta reservado */
  const { err: erroBuscaQuatidade, v: quantidadeReservado } = await repo.CountReservaByPresenteId(dto.presenteId);
  if (erroBuscaQuatidade) return E.Fail(erroBuscaQuatidade);
  if (quantidadeReservado >= 1) {
    return E.Fail(new NegotiateException("Presente ja reservado", "rule_businnes"));
  }

  /**Buscando ou criando o usuario que esta fazendo a reserva */
  let { err: errUser, v: userEncounted } = await repo.FindUserByNumero(numeroLimpo);
  if (errUser) return E.Fail(errUser);

  if (!userEncounted) {
    const { err, v } = await GerarUsuario(dto);
    if (err) return E.Fail(err);
    userEncounted = v;
  }

  /** Salvando a reserva do presente */
  const { err: errInsertConvidado } = await E.Db(
    db.insert(convidado).values({
      messagem: dto.mensagem,
      userId: userEncounted.id,
      presenteId: presenteEncontrado.id,
    }),
  );
  if (errInsertConvidado) return E.Fail(errInsertConvidado);

  return E.Ok(true);
}

async function GerarUsuario(dto: ReservarPresenteInput): E.R<UserModel> {
  const numeroLimpo = SanitizarNumero(dto.numero);
  if (numeroLimpo.length < 9) {
    return E.Fail(new NegotiateException("Insira um número valido", "validation"));
  }

  const { err: errUser, v } = await E.Db(
    db
      .insert(user)
      .values({
        name: dto.nomeCompleto.trim(),
        numero: numeroLimpo,
      })
      .returning(),
  );
  if (errUser) return E.Fail(errUser);

  return E.Ok(v[0]);
}

function SanitizarNumero(n: string) {
  return n?.replace(/[^0-9]/gi, "");
}

