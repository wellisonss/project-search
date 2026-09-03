import { Injectable, Logger } from '@nestjs/common';
import { SearchService } from './search.service';

interface ProdutoDaApiPrincipal {
  sku: string;
  name: string;
  brand: string;
  categories: string;
  fornecedor: string;
  isActive: string;
  listasPrecoIds: number[];
  listasPrecoNomes: string[];
  _vectors?: { default: number[] };
}

interface RespostaApiPrincipal {
  listas: { id: number; nome: string }[];
  produtos: ProdutoDaApiPrincipal[];
}

const EMBED_MODEL = 'gemini-embedding-001';
// Limite prático de itens por chamada batchEmbedContents — validado contra
// rate limit real do Gemini (ver scripts/povoar-project-search.js original).
const EMBED_BATCH_SIZE = 100;
const MAX_RETRIES = 6;
const RETRY_BASE_MS = 2000;
const LOTE_INDEXACAO = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function textoParaEmbedding(produto: ProdutoDaApiPrincipal): string {
  return `Produto: ${produto.name}. Marca: ${produto.brand}. Categoria: ${produto.categories}. Fornecedor: ${produto.fornecedor}.`;
}

/**
 * Busca o catálogo cru de uma lista de preço na API principal (dados do
 * ERP, sem noção de Meilisearch/busca) e indexa aqui — este serviço é o
 * dono do processo de povoamento: decide formato, embeddings e full_sync.
 */
@Injectable()
export class PovoamentoService {
  private readonly logger = new Logger(PovoamentoService.name);

  constructor(private readonly searchService: SearchService) {}

  async povoarPorListaPreco(priceListVersionIds: number[]): Promise<Record<string, unknown>> {
    const apiUrl = process.env.API_PRINCIPAL_URL;
    if (!apiUrl) throw new Error('API_PRINCIPAL_URL não configurada.');

    const secret = process.env.PROJECT_SEARCH_SECRET;
    const headers: Record<string, string> = secret ? { 'x-project-search-secret': secret } : {};

    const url = `${apiUrl.replace(/\/+$/, '')}/busca-produtos/produtos-por-lista?ids=${priceListVersionIds.join(',')}`;
    this.logger.log(`Buscando catálogo na API principal (listas: ${priceListVersionIds.join(', ')})...`);
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`API principal falhou: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
    }
    const dados = (await res.json()) as RespostaApiPrincipal;
    this.logger.log(`${dados.produtos.length} produtos recebidos [${dados.listas.map((l) => l.nome).join(', ')}].`);

    if (dados.produtos.length === 0) {
      return { mensagem: 'Nenhum produto encontrado nas listas informadas.', listas: dados.listas, total_enviados: 0 };
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const totais = { novos: 0, atualizados: 0, inalterados: 0, removidos_na_limpeza: 0 };
    let totalEnviados = 0;

    for (let i = 0; i < dados.produtos.length; i += LOTE_INDEXACAO) {
      const lote = dados.produtos.slice(i, i + LOTE_INDEXACAO);
      if (geminiKey) {
        await this.anexarEmbeddings(lote, geminiKey);
      }
      const resultado = await this.searchService.indexarProdutos({
        full_sync: i === 0,
        produtos: lote,
      });
      const stats = resultado.estatisticas ?? {};
      totais.novos += stats.novos ?? 0;
      totais.atualizados += stats.atualizados ?? 0;
      totais.inalterados += stats.inalterados ?? 0;
      totais.removidos_na_limpeza += stats.removidos_na_limpeza ?? 0;
      totalEnviados += lote.length;
      this.logger.log(`Lote indexado: ${totalEnviados}/${dados.produtos.length} produtos.`);
    }

    return {
      mensagem: 'Povoamento concluído!',
      listas: dados.listas,
      total_enviados: totalEnviados,
      estatisticas: totais,
    };
  }

  private async anexarEmbeddings(produtos: ProdutoDaApiPrincipal[], apiKey: string): Promise<void> {
    for (let i = 0; i < produtos.length; i += EMBED_BATCH_SIZE) {
      const sublote = produtos.slice(i, i + EMBED_BATCH_SIZE);
      const vetores = await this.embedTextos(sublote.map(textoParaEmbedding), apiKey);
      sublote.forEach((p, idx) => {
        p._vectors = { default: vetores[idx] };
      });
      await sleep(300);
    }
  }

  private async embedTextos(textos: string[], apiKey: string): Promise<number[][]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:batchEmbedContents?key=${apiKey}`;
    const body = {
      requests: textos.map((text) => ({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text }] },
      })),
    };

    for (let tentativa = 0; tentativa < MAX_RETRIES; tentativa++) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 429 || res.status === 503) {
        const delay = RETRY_BASE_MS * 2 ** tentativa;
        this.logger.warn(`Gemini HTTP ${res.status} — esperando ${delay}ms (tentativa ${tentativa + 1}/${MAX_RETRIES})...`);
        await sleep(delay);
        continue;
      }
      if (!res.ok) {
        throw new Error(`Gemini batchEmbedContents falhou: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
      }
      const data = (await res.json()) as { embeddings: { values: number[] }[] };
      return data.embeddings.map((e) => e.values);
    }
    throw new Error('Gemini: rate limit persistente após todas as tentativas.');
  }
}
