<script setup>
/**
 * Lista de Presentes — Carla & Cristian
 * -------------------------------------
 * SPA único em Vue 3 (Composition API + <script setup>) para os convidados
 * escolherem e reservarem presentes do casamento.
 *
 * Catálogo e reservas: consumidos da API do casal em
 * https://back.cristian-e-carla.online/
 *   GET  /presentes            → lista de presentes
 *   POST /presentes/reservar   → efetiva uma reserva
 *
 */
import { computed, onMounted, reactive, ref, watch } from "vue";
import folhaDecorativa from "./assets/folha.png";

/* ------------------------------------------------------------------ */
/* Configurações do casal — troque pelos dados reais antes de publicar */
/* ------------------------------------------------------------------ */
const NOIVOS = {
  nomes: "Carla & Cristian",
  data: "19 de Outubro de 2026",
  pixChave: "carlaecristian.casamento@pix.com.br",
  pixTitular: "Carla Silva",
  whatsapp: "5591999999999", // formato internacional, somente dígitos
};

// Base da API do backend do casamento.
const API_URL = "https://back.cristian-e-carla.online";

/* ------------------------------------------------------------------ */
/* Estado reativo                                                      */
/* ------------------------------------------------------------------ */
const gifts = ref([]);
const carregandoCatalogo = ref(true);
const erroCatalogo = ref("");

const buscaTexto = ref("");
const categoriaSelecionada = ref("Todas");
const ordenacao = ref("relevancia"); // 'relevancia' | 'menor' | 'maior'

// Categorias com o acordeão aberto na visão mobile
const categoriasAbertas = reactive(new Set());

const modalAberto = ref(false);
const modalEtapa = ref("form"); // 'form' | 'sucesso'
const presenteSelecionado = ref(null);
const pixCopiado = ref(false);

const form = reactive({ nome: "", whatsapp: "", mensagem: "" });
const formErros = reactive({ nome: "", whatsapp: "", geral: "" });
const enviando = ref(false);

/* ------------------------------------------------------------------ */
/* Carregamento do catálogo (API)                                      */
/* ------------------------------------------------------------------ */
async function carregarCatalogo() {
  carregandoCatalogo.value = true;
  erroCatalogo.value = "";
  try {
    const resposta = await fetch(`${API_URL}/presentes`);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const dados = await resposta.json();

    // A API manda quantidadeTotal/quantidadeReservada como string —
    // convertemos para número aqui, uma única vez, para o resto do
    // app poder fazer conta com esses campos livremente.
    gifts.value = dados.map((p) => ({
      id: p.id,
      titulo: p.titulo,
      categoria: p.categoria,
      preco: Number(p.preco),
      imagemUrl: p.imagemUrl,
      quantidadeTotal: Number(p.quantidadeTotal),
      quantidadeReservada: Number(p.quantidadeReservada),
    }));
  } catch (erro) {
    console.error(
      "Não foi possível carregar a lista de presentes da API:",
      erro,
    );
    gifts.value = [];
    erroCatalogo.value =
      "Não foi possível carregar a lista de presentes agora. Tente recarregar a página em instantes.";
  } finally {
    carregandoCatalogo.value = false;
  }
}

onMounted(() => {
  carregarCatalogo();
});

/* ------------------------------------------------------------------ */
/* Regras de negócio: cotas e status                                   */
/* ------------------------------------------------------------------ */
function vagasRestantes(presente) {
  return Math.max(presente.quantidadeTotal - presente.quantidadeReservada, 0);
}

function statusPresente(presente) {
  const vagas = vagasRestantes(presente);
  if (vagas <= 0) {
    return { texto: "Esgotado", classe: "bg-ink/10 text-ink/50" };
  }
  return { texto: "Disponível", classe: "bg-sage-100 text-sage-700" };
}

/* ------------------------------------------------------------------ */
/* Filtros, busca e ordenação                                          */
/* ------------------------------------------------------------------ */
const categorias = computed(() => {
  const unicas = [...new Set(gifts.value.map((g) => g.categoria))];
  return ["Todas", ...unicas];
});

const presentesFiltrados = computed(() => {
  const termo = buscaTexto.value.trim().toLowerCase();

  let lista = gifts.value.filter((g) => {
    const combinaBusca = termo === "" || g.titulo.toLowerCase().includes(termo);
    const combinaCategoria =
      categoriaSelecionada.value === "Todas" ||
      g.categoria === categoriaSelecionada.value;
    return combinaBusca && combinaCategoria;
  });

  if (ordenacao.value === "menor") {
    lista = [...lista].sort((a, b) => a.preco - b.preco);
  } else if (ordenacao.value === "maior") {
    lista = [...lista].sort((a, b) => b.preco - a.preco);
  }

  return lista;
});

// Agrupamento por categoria, usado na visão mobile (acordeão). Segue a
// mesma ordem de `categorias` e só lista grupos com pelo menos um item
// depois dos filtros aplicados.
const presentesAgrupados = computed(() => {
  const grupos = {};
  for (const presente of presentesFiltrados.value) {
    if (!grupos[presente.categoria]) grupos[presente.categoria] = [];
    grupos[presente.categoria].push(presente);
  }

  return categorias.value
    .filter((cat) => cat !== "Todas" && grupos[cat]?.length)
    .map((cat) => ({ categoria: cat, itens: grupos[cat] }));
});

function alternarCategoriaAberta(categoria) {
  if (categoriasAbertas.has(categoria)) categoriasAbertas.delete(categoria);
  else categoriasAbertas.add(categoria);
}

function categoriaEstaAberta(categoria) {
  return categoriasAbertas.has(categoria);
}

// Ao escolher uma categoria específica no filtro, abre automaticamente
// o respectivo grupo no acordeão mobile.
watch(categoriaSelecionada, (nova) => {
  if (nova !== "Todas") categoriasAbertas.add(nova);
});

function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* ------------------------------------------------------------------ */
/* Máscara simples de telefone/WhatsApp                                */
/* ------------------------------------------------------------------ */
function aoDigitarWhatsapp(evento) {
  const digitos = evento.target.value.replace(/\D/g, "").slice(0, 11);
  let formatado = digitos;
  if (digitos.length > 2)
    formatado = `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length > 7) {
    formatado = `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  form.whatsapp = formatado;
}

/* ------------------------------------------------------------------ */
/* Fluxo do modal de reserva                                           */
/* ------------------------------------------------------------------ */
function abrirModalReserva(presente) {
  if (vagasRestantes(presente) <= 0) return;

  presenteSelecionado.value = presente;
  form.nome = "";
  form.whatsapp = "";
  form.mensagem = "";
  formErros.nome = "";
  formErros.whatsapp = "";
  formErros.geral = "";
  pixCopiado.value = false;
  modalEtapa.value = "form";
  modalAberto.value = true;
}

function fecharModal() {
  modalAberto.value = false;
  presenteSelecionado.value = null;
}

function validarFormulario() {
  formErros.nome =
    form.nome.trim().length < 3 ? "Informe seu nome completo." : "";
  const digitosWhats = form.whatsapp.replace(/\D/g, "");
  formErros.whatsapp =
    digitosWhats.length < 10 ? "Informe um WhatsApp válido com DDD." : "";
  formErros.geral = "";
  return !formErros.nome && !formErros.whatsapp;
}

async function confirmarReserva() {
  if (!validarFormulario()) return;
  enviando.value = true;
  formErros.geral = "";

  const presente = gifts.value.find(
    (g) => g.id === presenteSelecionado.value?.id,
  );

  if (!presente || vagasRestantes(presente) <= 0) {
    formErros.geral =
      "Que pena! Esse presente acabou de ser reservado por outro convidado.";
    enviando.value = false;
    return;
  }

  try {
    const resposta = await fetch(`${API_URL}/presentes/reservar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        presenteId: presente.id,
        nomeCompleto: form.nome.trim(),
        numero: form.whatsapp,
        mensagem: form.mensagem.trim(),
      }),
    });

    if (!resposta.ok) {
      const erro = await resposta.json().catch(() => null);
      throw new Error(
        erro?.message ||
          `Não foi possível concluir a reserva (HTTP ${resposta.status}).`,
      );
    }

    const reservaConfirmada = await resposta.json();
    if (reservaConfirmada !== true) {
      throw new Error("Não foi possível confirmar a reserva.");
    }

    await carregarCatalogo();
    modalEtapa.value = "sucesso";
  } catch (erro) {
    console.error("Não foi possível concluir a reserva:", erro);
    formErros.geral =
      erro instanceof Error
        ? erro.message
        : "Não foi possível concluir a reserva agora. Tente novamente.";
  } finally {
    enviando.value = false;
  }
}

function copiarChavePix() {
  navigator.clipboard
    .writeText(NOIVOS.pixChave)
    .then(() => {
      pixCopiado.value = true;
      setTimeout(() => (pixCopiado.value = false), 2500);
    })
    .catch(() => {
      formErros.geral =
        "Não foi possível copiar automaticamente. Copie a chave manualmente.";
    });
}

const linkWhatsappConfirmacao = computed(() => {
  const presente = presenteSelecionado.value;
  if (!presente) return "#";
  const texto = `Olá! Sou ${form.nome} e acabei de reservar o presente "${presente.titulo}" na lista de vocês! 💚`;
  return `https://wa.me/${NOIVOS.whatsapp}?text=${encodeURIComponent(texto)}`;
});
</script>

<template>
  <div class="min-h-screen bg-cream text-ink font-body">
    <!-- ============================== HERO ============================== -->
    <header class="relative overflow-hidden border-b border-line">
      <img
        :src="folhaDecorativa"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute -right-6 -top-4 w-40 opacity-90 sm:-right-10 sm:-top-6 sm:w-72 md:w-96"
      />
      <img
        :src="folhaDecorativa"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute -left-10 bottom-0 w-36 rotate-[200deg] opacity-70 sm:-left-16 sm:w-64 md:w-80"
      />

      <div
        class="relative mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-20 md:py-28"
      >
        <p class="text-xs uppercase tracking-[0.2em] text-sage-600 sm:text-sm">
          {{ NOIVOS.data }}
        </p>
        <h1
          class="mt-4 font-display text-4xl italic text-ink sm:text-5xl md:text-7xl"
        >
          {{ NOIVOS.nomes }}
        </h1>
        <p
          class="mx-auto mt-6 max-w-md text-sm leading-relaxed text-ink/70 sm:text-base"
        >
        Escolhemos esta lista com carinho para quem quiser nos ajudar nesse início da nossa vida a dois. 💚 <br/>
        Se preferir nos presentear de forma física, também ficaremos muito felizes! O que importa é o carinho e, acima de tudo, a sua presença nesse dia tão especial.
        </p>
      </div>
    </header>

    <!-- ============================ FILTROS =============================== -->
    <div
      class="sticky top-0 z-30 border-b border-line bg-cream/90 backdrop-blur"
    >
      <div class="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
        <div class="flex items-center gap-2">
          <div class="relative flex-1">
            <svg
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
              />
            </svg>
            <input
              v-model="buscaTexto"
              type="text"
              placeholder="Buscar presente..."
              class="w-full rounded-xl border border-line bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-ink/40 focus:border-sage-400"
            />
          </div>

          <select
            v-model="ordenacao"
            class="shrink-0 rounded-xl border border-line bg-white px-2 py-2.5 text-xs focus:border-sage-400 sm:px-3 sm:text-sm md:w-56"
          >
            <option value="relevancia">Relevância</option>
            <option value="menor">Menor preço</option>
            <option value="maior">Maior preço</option>
          </select>
        </div>

        <!-- Filtro por categoria em chips roláveis — mais fácil de tocar no celular -->
        <div class="thin-scroll mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            v-for="cat in categorias"
            :key="cat"
            type="button"
            @click="categoriaSelecionada = cat"
            class="shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm"
            :class="
              categoriaSelecionada === cat
                ? 'border-sage-500 bg-sage-500 text-white'
                : 'border-line bg-white text-ink/60 hover:border-sage-300'
            "
          >
            {{ cat }}
          </button>
        </div>
      </div>
    </div>

    <!-- =========================== LISTA DE PRESENTES ======================== -->
    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <!-- Carregando o catálogo -->
      <p v-if="carregandoCatalogo" class="py-16 text-center text-ink/50">
        Carregando presentes...
      </p>

      <!-- Falha ao buscar presentes.json -->
      <p v-else-if="erroCatalogo" class="py-16 text-center text-red-500">
        {{ erroCatalogo }}
      </p>

      <!-- Nenhum resultado para os filtros atuais -->
      <p
        v-else-if="presentesFiltrados.length === 0"
        class="py-16 text-center text-ink/50"
      >
        Nenhum presente encontrado com esses filtros. Que tal tentar outra
        busca?
      </p>

      <template v-else>
        <!-- ---- Desktop / tablet (sm e acima): grade de cards ---- -->
        <div class="hidden sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          <article
            v-for="presente in presentesFiltrados"
            :key="presente.id"
            class="flex items-center gap-4 rounded-2xl border border-line/70 bg-white p-4 shadow-softer transition-shadow duration-300 hover:shadow-soft"
          >
            <img
              :src="presente.imagemUrl"
              :alt="presente.titulo"
              class="h-24 w-24 shrink-0 rounded-full object-cover md:h-28 md:w-28"
              loading="lazy"
            />

            <div class="flex min-w-0 flex-1 flex-col gap-1.5">
              <span class="text-xs uppercase tracking-wide text-sage-500">{{
                presente.categoria
              }}</span>

              <h3
                class="line-clamp-2 font-display text-lg leading-snug text-ink"
              >
                {{ presente.titulo }}
              </h3>

              <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span class="text-base font-semibold text-sage-700">{{
                  formatarPreco(presente.preco)
                }}</span>
                <span
                  class="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  :class="statusPresente(presente).classe"
                >
                  {{ statusPresente(presente).texto }}
                </span>
              </div>

              <p class="text-xs text-ink/50">
                {{ vagasRestantes(presente) }} de
                {{ presente.quantidadeTotal }} cota(s) disponível(is)
              </p>

              <button
                type="button"
                :disabled="vagasRestantes(presente) <= 0"
                @click="abrirModalReserva(presente)"
                class="mt-1 w-full rounded-xl bg-sage-500 py-2 text-xs font-medium text-white transition-colors duration-200 hover:bg-sage-600 disabled:cursor-not-allowed disabled:bg-ink/10 disabled:text-ink/40 sm:text-sm"
              >
                {{
                  vagasRestantes(presente) <= 0 ? "Já reservado" : "Presentear"
                }}
              </button>
            </div>
          </article>
        </div>

        <!-- ---- Mobile (abaixo de sm): acordeão por categoria com cards em coluna única ---- -->
        <div class="space-y-3 sm:hidden">
          <div
            v-for="grupo in presentesAgrupados"
            :key="grupo.categoria"
            class="overflow-hidden rounded-2xl border border-line/70 bg-white"
          >
            <button
              type="button"
              @click="alternarCategoriaAberta(grupo.categoria)"
              class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
            >
              <span class="flex items-baseline gap-2">
                <span class="font-display text-lg text-ink">{{
                  grupo.categoria
                }}</span>
                <span class="text-xs text-ink/40"
                  >({{ grupo.itens.length }})</span
                >
              </span>
              <svg
                class="h-4 w-4 shrink-0 text-ink/40 transition-transform duration-200"
                :class="{ 'rotate-180': categoriaEstaAberta(grupo.categoria) }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div
              v-show="categoriaEstaAberta(grupo.categoria)"
              class="space-y-3 border-t border-line/70 p-3"
            >
              <article
                v-for="presente in grupo.itens"
                :key="presente.id"
                class="flex w-full items-center gap-3 rounded-xl border border-line/60 p-3"
              >
                <img
                  :src="presente.imagemUrl"
                  :alt="presente.titulo"
                  class="h-20 w-20 shrink-0 rounded-full object-cover"
                  loading="lazy"
                />
                <div class="flex min-w-0 flex-1 flex-col gap-1">
                  <h3
                    class="line-clamp-2 font-display text-base leading-snug text-ink"
                  >
                    {{ presente.titulo }}
                  </h3>

                  <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span class="text-sm font-semibold text-sage-700">{{
                      formatarPreco(presente.preco)
                    }}</span>
                    <span
                      class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      :class="statusPresente(presente).classe"
                    >
                      {{ statusPresente(presente).texto }}
                    </span>
                  </div>

                  <p class="text-[11px] text-ink/50">
                    {{ vagasRestantes(presente) }} de
                    {{ presente.quantidadeTotal }} cota(s) disponível(is)
                  </p>

                  <button
                    type="button"
                    :disabled="vagasRestantes(presente) <= 0"
                    @click="abrirModalReserva(presente)"
                    class="mt-1 w-full rounded-lg bg-sage-500 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-sage-600 disabled:cursor-not-allowed disabled:bg-ink/10 disabled:text-ink/40"
                  >
                    {{
                      vagasRestantes(presente) <= 0
                        ? "Já reservado"
                        : "Presentear"
                    }}
                  </button>
                </div>
              </article>
            </div>
          </div>
        </div>
      </template>
    </main>

    <!-- =============================== RODAPÉ ============================== -->
    <footer class="border-t border-line py-10 text-center">
      <p class="text-sm text-ink/60">
        Feito com carinho para o nosso grande dia 💚
      </p>
    </footer>

    <!-- ========================= MODAL DE RESERVA ========================== -->
    <div
      v-if="modalAberto"
      class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      @click.self="fecharModal"
    >
      <div
        class="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-cream p-4 shadow-soft sm:p-6"
      >
        <button
          type="button"
          @click="fecharModal"
          aria-label="Fechar"
          class="absolute right-4 top-4 text-ink/40 hover:text-ink/70"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <!-- Etapa 1: formulário de reserva -->
        <template v-if="modalEtapa === 'form'">
          <div class="flex items-center gap-3 border-b border-line pb-4">
            <img
              :src="presenteSelecionado?.imagemUrl"
              :alt="presenteSelecionado?.titulo"
              class="h-16 w-16 rounded-xl object-cover"
            />
            <div>
              <h2 class="font-display text-lg text-ink">
                {{ presenteSelecionado?.titulo }}
              </h2>
              <p class="text-sm text-sage-700">
                {{ formatarPreco(presenteSelecionado?.preco || 0) }}
              </p>
            </div>
          </div>

          <form class="mt-4 space-y-4" @submit.prevent="confirmarReserva">
            <div>
              <label class="mb-1 block text-sm text-ink/70"
                >Nome completo *</label
              >
              <input
                v-model="form.nome"
                type="text"
                placeholder="Seu nome"
                class="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus:border-sage-400"
              />
              <p v-if="formErros.nome" class="mt-1 text-xs text-red-500">
                {{ formErros.nome }}
              </p>
            </div>

            <div>
              <label class="mb-1 block text-sm text-ink/70">WhatsApp *</label>
              <input
                :value="form.whatsapp"
                @input="aoDigitarWhatsapp"
                type="tel"
                inputmode="numeric"
                placeholder="(00) 00000-0000"
                class="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus:border-sage-400"
              />
              <p v-if="formErros.whatsapp" class="mt-1 text-xs text-red-500">
                {{ formErros.whatsapp }}
              </p>
            </div>

            <div>
              <label class="mb-1 block text-sm text-ink/70"
                >Mensagem carinhosa aos noivos</label
              >
              <textarea
                v-model="form.mensagem"
                rows="3"
                placeholder="Deixe um recadinho (opcional)"
                class="w-full resize-none rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus:border-sage-400"
              ></textarea>
            </div>

            <p v-if="formErros.geral" class="text-sm text-red-500">
              {{ formErros.geral }}
            </p>

            <button
              type="submit"
              :disabled="enviando"
              class="w-full rounded-xl bg-sage-500 py-3 text-sm font-medium text-white hover:bg-sage-600 disabled:opacity-60"
            >
              {{ enviando ? "Enviando reserva..." : "Confirmar Reserva" }}
            </button>
          </form>
        </template>

        <!-- Etapa 2: sucesso + instruções de pagamento -->
        <template v-else>
          <div class="text-center">
            <div
              class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sage-100 text-sage-600"
            >
              <svg
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 class="mt-3 font-display text-2xl text-ink">
              Reserva confirmada!
            </h2>
            <p class="mt-1 text-sm text-ink/60">
              Muito obrigado, {{ form.nome.split(" ")[0] }}! Presente reservado com sucesso! ❤️ <br/>
              Obrigado pelo carinho e por fazer parte desse momento tão especial. 🥰 <br/>
              Será enviado uma mensagem de confirmação no seu Whatsapp!
            </p>
          </div>

          <div class="mt-6 rounded-xl border border-line bg-white p-4">
            <p class="text-xs uppercase tracking-wide text-ink/50">
              Chave PIX dos noivos
            </p>
            <p class="text-xs text-ink/40">{{ NOIVOS.pixTitular }}</p>
            <div
              class="mt-2 flex items-center justify-between gap-2 rounded-lg bg-sage-50 px-3 py-2"
            >
              <span class="truncate font-mono text-sm text-ink">{{
                NOIVOS.pixChave
              }}</span>
              <button
                type="button"
                @click="copiarChavePix"
                class="shrink-0 rounded-lg bg-sage-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sage-600"
              >
                {{ pixCopiado ? "Copiado!" : "Copiar" }}
              </button>
            </div>
          </div>

          <button
            type="button"
            @click="fecharModal"
            class="mt-3 w-full rounded-xl border border-line py-2.5 text-sm text-ink/60 hover:bg-white"
          >
            Fechar
          </button>
        </template>
      </div>
    </div>

    <!-- O painel de reservas depende de um endpoint administrativo ainda não disponível. -->
    <div
      v-if="false"
      class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      @click.self="fecharAdmin"
    >
      <div
        class="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-cream p-4 shadow-soft sm:p-6"
      >
        <button
          type="button"
          @click="fecharAdmin"
          aria-label="Fechar"
          class="absolute right-4 top-4 text-ink/40 hover:text-ink/70"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <!-- Login simples do painel -->
        <template v-if="!adminAutenticado">
          <h2 class="font-display text-2xl text-ink">Área dos Noivos</h2>
          <p class="mt-1 text-sm text-ink/60">
            Digite a senha para ver as reservas recebidas.
          </p>

          <form class="mt-4 space-y-3" @submit.prevent="autenticarAdmin">
            <input
              v-model="adminSenhaDigitada"
              type="password"
              placeholder="Senha"
              class="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus:border-sage-400"
            />
            <p v-if="adminErro" class="text-sm text-red-500">{{ adminErro }}</p>
            <button
              type="submit"
              class="w-full rounded-xl bg-sage-500 py-2.5 text-sm font-medium text-white hover:bg-sage-600"
            >
              Entrar
            </button>
          </form>
        </template>

        <!-- Conteúdo do painel -->
        <template v-else>
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="font-display text-2xl text-ink">Reservas recebidas</h2>
              <p class="text-sm text-ink/60">
                {{ totalReservas }} reserva(s) ·
                {{ formatarPreco(valorTotalReservado) }} em presentes
              </p>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                @click="exportarCSV"
                :disabled="totalReservas === 0"
                class="rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-ink/70 hover:bg-sage-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Exportar CSV
              </button>
              <button
                type="button"
                @click="limparReservas"
                :disabled="totalReservas === 0"
                class="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Limpar reservas
              </button>
            </div>
          </div>

          <div
            class="thin-scroll mt-4 max-h-96 overflow-auto rounded-xl border border-line"
          >
            <table class="w-full min-w-[640px] text-left text-sm">
              <thead
                class="sticky top-0 bg-sage-50 text-xs uppercase tracking-wide text-ink/50"
              >
                <tr>
                  <th class="px-3 py-2">Nome</th>
                  <th class="px-3 py-2">WhatsApp</th>
                  <th class="px-3 py-2">Presente</th>
                  <th class="px-3 py-2">Mensagem</th>
                  <th class="px-3 py-2">Data/Hora</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="r in reservas"
                  :key="r.id"
                  class="border-t border-line/70 align-top hover:bg-white"
                >
                  <td class="px-3 py-2 font-medium text-ink">{{ r.nome }}</td>
                  <td class="px-3 py-2 text-ink/70">{{ r.whatsapp }}</td>
                  <td class="px-3 py-2 text-ink/70">{{ r.giftTitulo }}</td>
                  <td class="max-w-[14rem] px-3 py-2 text-ink/60">
                    {{ r.mensagem || "—" }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-2 text-ink/50">
                    {{ formatarDataHora(r.dataHora) }}
                  </td>
                </tr>
                <tr v-if="totalReservas === 0">
                  <td colspan="5" class="px-3 py-8 text-center text-ink/40">
                    Nenhuma reserva ainda.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
