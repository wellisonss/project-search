# Guia de População e Configuração de Dados - API de Busca

---

## 1. Povoar o Catálogo de Produtos (Sincronização)

O endpoint de produtos funciona como um **Smart Upsert**. Ele identifica automaticamente produtos novos, atualizados e inalterados. Além disso, suporta a exclusão automática de produtos antigos através da flag `full_sync`.

- **Endpoint:** `POST /busca/produtos`
- **Regra da Chave Primária:** Todos os objetos JSON devem conter o campo `id`.

### Campos Otimizados para Busca/Retorno

- `sku`
- `name`
- `brand`
- `categories`
- `fornecedor`
- `segmento`
- `image` (Novo - URL da imagem do produto)

---

### Exemplo de Payload (JSON)

```json
{
  "full_sync": true,
  "produtos": [
    {
      "id": "1",
      "sku": "12345",
      "name": "Smartphone Samsung Galaxy S25 Plus",
      "brand": "Samsung",
      "categories": ["Eletrônicos", "Celulares"],
      "fornecedor": "Samsung BR",
      "segmento": "Premium",
      "image": "https://meusite.com/imagens/s25plus.jpg"
    },
    {
      "id": "2",
      "sku": "67890",
      "name": "Cabo USB-C",
      "brand": "Genérica",
      "categories": ["Acessórios"],
      "fornecedor": "Distribuidora XYZ",
      "segmento": "Básico",
      "image": "https://meusite.com/imagens/cabousbc.jpg"
    }
  ]
}
```

---

### Nota sobre o `full_sync`

- **true:** Realiza uma carga completa. O motor de busca deletará qualquer produto que já esteja no índice, mas que não foi enviado neste array atual.
- **false:** Realiza apenas uma carga incremental (adiciona ou atualiza, mas não deleta nada).

---

### Retorno da Sincronização

```json
{
  "mensagem": "Sincronização completa realizada!",
  "total_enviados": 2,
  "novos": 1,
  "atualizados": 0,
  "inalterados": 1,
  "removidos_na_limpeza": 5
}
```

---

## 2. Configurar Sinónimos

Os sinónimos ajudam o motor de busca a devolver resultados precisos mesmo quando os utilizadores pesquisam por termos diferentes dos que estão cadastrados.

- **Endpoint:** `POST /busca/sinonimos`

### Exemplo de Payload - Sinónimos (JSON)

```json
{
  "celular": ["smartphone", "telefone", "mobile"],
  "fone": ["headset", "earbud", "auscultador"]
}
```

---

## 3. Validar e Consumir a API

Após a inserção dos dados (API rodando na porta `3000` via Docker):

### Validar Inserções e Imagens

- `GET /busca/cadastrados`

```json
{
  "total_produtos": 2,
  "produtos": [
    {
      "id": "1",
      "name": "Smartphone Samsung Galaxy S25 Plus",
      "image": "https://meusite.com/imagens/s25plus.jpg",
      "...": "..."
    }
  ]
}
```

- `GET /busca/sinonimos`
