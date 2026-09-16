# Lista de Presentes — Carla & Cristian 💚

Protótipo de SPA (Vue 3 + Vite + Tailwind CSS) para os convidados escolherem
e reservarem presentes do casamento, com fluxo de reserva, instruções de
pagamento via PIX/WhatsApp e um painel simples para os noivos acompanharem
tudo.

## Como rodar

```bash
npm install
npm run dev
```

Acesse o endereço mostrado no terminal (geralmente `http://localhost:5173`).

Para gerar a versão de produção:

```bash
npm run build
npm run preview   # opcional, para testar o build localmente
```

## Estrutura

```
lista-presentes/
├── index.html
├── package.json
├── tailwind.config.js      ← paleta de cores e tipografia
├── postcss.config.js
├── vite.config.js
├── public/
│   └── presentes.json      ← catálogo de presentes (edite aqui!)
└── src/
    ├── main.js
    ├── style.css           ← import do Tailwind + ajustes globais
    ├── assets/
    │   └── folha.png       ← recorte floral extraído do convite
    └── App.vue             ← toda a aplicação (catálogo, modal, admin)
```

## Editando a lista de presentes

O catálogo **não fica mais dentro do código** — ele é carregado em tempo
de execução a partir de `public/presentes.json`. Para adicionar, remover
ou alterar um presente, basta editar esse arquivo (não precisa saber
Vue). Cada item segue este formato:

```json
{
  "id": 1,
  "titulo": "Airfryer 5L",
  "categoria": "Cozinha",
  "preco": 349.9,
  "imagemUrl": "https://exemplo.com/foto.jpg",
  "quantidadeTotal": 2,
  "quantidadeReservada": 0
}
```

- `id` precisa ser único no arquivo.
- `categoria` define automaticamente em qual grupo do acordeão (visão
  mobile) e em qual chip de filtro o item aparece — categorias novas
  aparecem sozinhas, sem precisar mexer no código.
- `quantidadeReservada` no JSON é apenas informativo/ponto de partida —
  na prática, a quantidade reservada de cada presente é sempre
  **calculada a partir das reservas já feitas** (guardadas no
  navegador do convidado), então você pode editar o catálogo livremente
  sem apagar o progresso de reservas.

## O que personalizar antes de publicar

Tudo fica concentrado no topo de `src/App.vue`, dentro da constante `NOIVOS`:

```js
const NOIVOS = {
  nomes: 'Carla & Cristian',
  data: '19 de Outubro de 2026',
  pixChave: 'carlaecristian.casamento@pix.com.br',
  pixTitular: 'Carla Silva',
  whatsapp: '5591999999999', // formato internacional, só dígitos
}

const ADMIN_SENHA = '1910'
```

- **`pixChave`** → chave PIX real que aparecerá no modal de confirmação.
- **`whatsapp`** → número que recebe a mensagem de confirmação (formato
  `55` + DDD + número, só dígitos).
- **`ADMIN_SENHA`** → senha de acesso à "Área dos Noivos". É apenas uma
  trava de interface (não é segurança real) — adequada para uso entre
  convidados de boa-fé, não para dados sensíveis.

A lista de presentes (`presentesPadrao`, também em `App.vue`) é o mock
inicial: cada item tem `id`, `titulo`, `categoria`, `preco`, `imagemUrl`,
`quantidadeTotal` e `quantidadeReservada`. Edite, adicione ou remova itens
livremente — as fotos usam `picsum.photos` como placeholder; troque
`imagemUrl` por fotos reais dos produtos quando publicar.

## Como funciona a persistência

Não há backend. O **catálogo** vem sempre fresco de `public/presentes.json`
a cada carregamento da página; as **reservas** ficam salvas no
`localStorage` do navegador de quem está usando a página (chave
`lp_reservas_v1`). Isso significa que:

- As reservas feitas em um navegador **não aparecem automaticamente** em
  outro navegador/dispositivo — é um protótipo local.
- Editar `presentes.json` não apaga reservas já feitas, porque a
  quantidade reservada de cada presente é calculada a partir da lista
  de reservas (não fica salva junto com o presente).
- Para um site real compartilhado entre todos os convidados, troque as
  funções `carregarCatalogo()` / `salvarReservas()` em `App.vue` por
  chamadas a uma API/banco de dados (ex.: Supabase, Firebase, uma
  planilha via Google Sheets API, etc.).

## Paleta e tipografia

As cores (`tailwind.config.js`) foram extraídas do convite oficial:
tons de eucalipto (`sage`), dourado envelhecido (`gold`) e um fundo
off-white quente (`cream`). A tipografia combina **Cormorant Garamond**
(itálico, para o nome do casal e títulos) com **Inter** (para textos de
interface, formulários e botões).
