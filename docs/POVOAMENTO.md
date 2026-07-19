# Guia de Povoamento (Indexação de Produtos)

Este projeto **não inclui um catálogo de produtos** — os dados são seus. Abaixo estão
as formas de popular o motor de busca com os seus próprios produtos.

O endpoint de indexação funciona como um **Smart Upsert**: identifica automaticamente
produtos novos, atualizados e inalterados e, opcionalmente, remove os que não vieram
no lote (via a flag `full_sync`).

- **Endpoint:** `POST /products/produtos`
- **Chave primária:** cada produto deve ter um campo **`sku`** único.

---

## 1. Formato do payload

```json
{
  "full_sync": true,
  "produtos": [
    {
      "sku": "12345",
      "name": "Smartphone Galaxy S25 Plus",
      "brand": "Samsung",
      "categories": "Eletrônicos > Celulares",
      "fornecedor": "Fornecedor A",
      "segmento": "Premium",
      "price": 4999.9,
      "image": "https://exemplo.com/img/s25plus.jpg",
      "quantityAvailable": 42,
      "isActive": "S"
    }
  ]
}
```

### Campo `full_sync`

| Valor   | Comportamento                                                                 |
| ------- | ----------------------------------------------------------------------------- |
| `true`  | Carga completa. Remove do índice qualquer produto que **não** esteja no lote. |
| `false` | Carga incremental. Apenas adiciona/atualiza; nada é removido.                 |

> Dica: envie em lotes (ex.: 500 produtos por requisição). Use `full_sync: true`
> **apenas no primeiro lote** e `false` nos seguintes, para não apagar o que já subiu.

### Campos reconhecidos

Campos usados na busca e no retorno da vitrine (todos opcionais, exceto `sku`):

- **Básicos:** `sku`, `name`, `price`, `image`, `categories`, `brand`, `fornecedor`, `segmento`, `quantityAvailable`, `isActive` (`"S"`/`"N"`)
- **Multi-região (exemplo com 3 regiões):** `uf_maranhao`, `uf_tocantins`, `uf_para`, `uf_nacional`, `saldo_MA`, `saldo_TO`, `saldo_PA`, `preco_sug_MA`, `preco_sug_TO`, `preco_sug_PA`, `preco_venda_nac`
- **Extras:** `ranking`, `embalagem`, `custo_cd`, `facing_atual_MA`, `facing_atual_TO`, `facing_atual_PA`

> O modelo de dados suporta estoque/preço por região. Se o seu catálogo é
> single-region, basta preencher `quantityAvailable`/`price` e ignorar os campos regionais.

---

## 2. Opção A — via `curl`

```bash
curl -X POST http://localhost:3336/products/produtos \
  -H "Content-Type: application/json" \
  -d '{
    "full_sync": true,
    "produtos": [
      { "sku": "1", "name": "Camiseta Básica", "brand": "Acme", "price": 59.9, "quantityAvailable": 10, "isActive": "S" }
    ]
  }'
```

---

## 3. Opção B — script importador (Node.js)

Use este script como ponto de partida para importar de um arquivo JSON, CSV ou de um
banco próprio. Ele lê um `produtos.json` e envia em lotes para a API.

Crie `scripts/importador.mjs`:

```js
// Uso: node scripts/importador.mjs
// Requer Node 18+ (fetch nativo). Lê ./produtos.json e envia em lotes.
import { readFile } from 'node:fs/promises';

const API_URL = process.env.API_URL || 'http://localhost:3336/products/produtos';
const LOTE = 500;

const num = (v) => (v != null && v !== '' ? Number(v) : 0);
const str = (v) => (v != null ? String(v).trim() : '');

const dados = JSON.parse(await readFile('./produtos.json', 'utf-8'));

const produtos = dados
  .map((row) => ({
    sku: str(row.sku),
    name: str(row.name),
    brand: str(row.brand),
    categories: str(row.categories),
    fornecedor: str(row.fornecedor),
    segmento: str(row.segmento),
    price: num(row.price),
    image: str(row.image),
    quantityAvailable: num(row.quantityAvailable),
    isActive: row.isActive ? 'S' : 'N',
  }))
  .filter((p) => p.sku !== '');

console.log(`Enviando ${produtos.length} produtos em lotes de ${LOTE}...`);

for (let i = 0; i < produtos.length; i += LOTE) {
  const lote = produtos.slice(i, i + LOTE);
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // full_sync só no primeiro lote (limpa o que não veio)
    body: JSON.stringify({ full_sync: i === 0, produtos: lote }),
  });
  const json = await resp.json();
  console.log(`Lote ${Math.floor(i / LOTE) + 1}:`, json.estatisticas ?? json);
}

console.log('Concluído!');
```

Rode com:

```bash
API_URL=http://localhost:3336/products/produtos node scripts/importador.mjs
```

---

## 4. Validar a carga

```bash
# Total e amostra dos produtos indexados
curl http://localhost:3336/products/cadastrados

# Testar uma busca
curl "http://localhost:3336/products/search?termo=camiseta&limit=5"
```

---

## 5. Limpar o índice

Para apagar **todos** os produtos do motor de busca:

```bash
curl -X DELETE http://localhost:3336/products/limpar
```
