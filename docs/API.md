# Referência da API

Base URL (local): `http://localhost:3336`
Todas as rotas ficam sob o prefixo **`/products`**.

---

## Busca

### `GET /products/search`

Busca principal da vitrine. Quando a busca com IA está ativa, usa modo **híbrido**
(semântico + textual) via embeddings do Gemini.

**Query params:**

| Parâmetro          | Tipo    | Padrão | Descrição                                              |
| ------------------ | ------- | ------ | ------------------------------------------------------ |
| `termo`            | string  | `""`   | Texto da busca                                         |
| `page`             | number  | `1`    | Página                                                 |
| `limit`            | number  | `70`   | Itens por página                                       |
| `estado`           | string  | —      | Região: `MA`, `TO` ou `PA`                             |
| `apenasComEstoque` | boolean | —      | `true` filtra apenas itens com saldo                   |
| `brands`           | string  | —      | Marcas separadas por vírgula                           |
| `categories`       | string  | —      | Categorias separadas por vírgula                       |
| `fornecedores`     | string  | —      | Fornecedores separados por vírgula                     |
| `segmentos`        | string  | —      | Segmentos separados por vírgula                        |
| `sort`             | string  | —      | `menor-preco` ou `maior-preco`                         |

**Exemplo:**

```bash
curl "http://localhost:3336/products/search?termo=notebook&limit=10&sort=menor-preco"
```

**Resposta:**

```json
{
  "produtos": [
    { "sku": "123", "name": "...", "price": 100, "_searchScore": 87, "...": "..." }
  ],
  "total": 42
}
```

---

## Indexação

### `POST /products/produtos`

Indexa/atualiza produtos (Smart Upsert). Veja [POVOAMENTO.md](./POVOAMENTO.md).

### `DELETE /products/limpar`

Remove **todos** os documentos do índice.

### `GET /products/cadastrados`

Lista os produtos indexados e o total.

---

## Sinônimos

Sinônimos ajudam o motor a retornar resultados mesmo quando o usuário busca por
termos diferentes dos cadastrados.

### `POST /products/sinonimos`

```json
{
  "celular": ["smartphone", "telefone", "mobile"],
  "fone": ["headset", "earbud"]
}
```

### `GET /products/sinonimos`

Lista os grupos de sinônimos configurados.

### `DELETE /products/sinonimos/:palavra`

Remove um grupo de sinônimos específico.

### `DELETE /products/sinonimos`

Remove todos os sinônimos.

---

## Configuração do motor

### `GET /products/config`

Retorna a configuração atual (`usar_ia`, `ordem_atributos`).

### `PUT /products/config/ia`

Liga/desliga a busca semântica (IA).

```json
{ "usar_ia": true }
```

### `PUT /products/config/atributos`

Define a ordem de prioridade dos campos pesquisáveis.

```json
{ "ordem": ["name", "brand", "categories", "sku", "fornecedor", "segmento"] }
```

---

## Métricas

### `GET /products/metricas`

Retorna estatísticas de uso: total de pesquisas, top 10 termos buscados e top 10
buscas sem resultado (oportunidades perdidas). Essas métricas alimentam o Dashboard
do painel.

```json
{
  "total_pesquisas_realizadas": 1234,
  "top_10_termos_buscados": [{ "termo": "notebook", "quantidade": 88 }],
  "top_10_pesquisas_sem_resultado": [{ "termo": "xyz", "quantidade": 5 }]
}
```
