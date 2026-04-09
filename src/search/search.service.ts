import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meilisearch } from 'meilisearch';
import { HistoricoBusca } from './historico.entity';

@Injectable()
export class SearchService implements OnModuleInit {
  private client: Meilisearch;

  constructor(
    @InjectRepository(HistoricoBusca)
    private historicoRepository: Repository<HistoricoBusca>,
  ) {
    this.client = new Meilisearch({
      // Configurado para o nome do serviço no Docker
      host: process.env.MEILISEARCH_HOST || 'http://meilisearch:7700',
      apiKey: process.env.MEILISEARCH_KEY || 'MinhaSenhaForteDeProducao2026!', 
    });
  }

  async onModuleInit() {
    console.log('⏳ Aplicando Configurações Avançadas de Tolerância e Relevância (31 Campos)...');
    const index = this.client.index('produtos');

    // Usamos updateSettings para garantir que todas as regras sejam aplicadas juntas
    await index.updateSettings({
      // 1. Tolerância a Erros: Muito mais permissiva
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: { 
          oneTypo: 2,  // Palavras curtas (2+ letras) já aceitam 1 erro (Ex: "B" por "P")
          twoTypos: 4  // Palavras com 4+ letras aceitam 2 erros (Ex: "blastico")
        },
        disableOnAttributes: [], 
      },

      // 2. Ranking Rules: Define a importância da busca
      rankingRules: [
        'words',
        'typo',      // <--- Prioridade para tolerância a erros
        'proximity',
        'attribute',
        'sort',
        'exactness',
      ],

      // 3. Atributos Pesquisáveis (Busca Textual)
      searchableAttributes: [
        'sku', 'name', 'brand', 'categories', 'fornecedor', 'segmento'
      ],

      // 3.1 Atributos Filtráveis (WHERE) - Novo Mapeamento
      filterableAttributes: [
        'brand', 'categories', 'fornecedor', 'segmento',
        'uf_maranhao', 'uf_tocantins', 'uf_para', 'uf_nacional',
        'saldo_MA', 'saldo_TO', 'saldo_PA', 'quantityAvailable', 'isActive'
      ],

      // 3.2 Atributos Ordenáveis (ORDER BY) - Novo Mapeamento
      sortableAttributes: [
        'price', 'saldo_MA', 'saldo_TO', 'saldo_PA', 'custo_cd', 'ranking'
      ],

      // 4. Configurações de Dicionário e Caracteres
      dictionary: ['d+'], 
      nonSeparatorTokens: ['+'], 

      // 5. Ajuste de Paginação: Permite que o contador do painel chegue até 10.000
      pagination: {
        maxTotalHits: 10000
      }
    });

    console.log('✅ Meilisearch configurado! Teste "blastico" no seu painel.');
  }

  // --- 1. FUNÇÕES DE SINÓNIMOS ---
  
  async atualizarSinonimos(sinonimos: Record<string, string[]>) {
    const index = this.client.index('produtos');
    return await index.updateSynonyms(sinonimos);
  }

  async listarSinonimos() {
    const index = this.client.index('produtos');
    return await index.getSynonyms();
  }

  async resetarSinonimos() {
    const index = this.client.index('produtos');
    return await index.resetSynonyms();
  }

  async removerUmSinonimo(palavraChave: string) {
    const index = this.client.index('produtos');
    const sinonimosAtuais = await index.getSynonyms();

    if (sinonimosAtuais && sinonimosAtuais[palavraChave]) {
      delete sinonimosAtuais[palavraChave];
      return await index.updateSynonyms(sinonimosAtuais);
    }
    return null; 
  }

  // --- 2. INDEXAÇÃO E SINCRONIZAÇÃO ---

  async indexarProdutos(payload: { full_sync: boolean; produtos: any[] }) {
    const index = this.client.index('produtos');
    const { full_sync, produtos } = payload;

    const existingDocs = new Map<string, any>();
    try {
      const result = await index.getDocuments({ limit: 100000 });
      // CORREÇÃO: Usando sku em vez de id
      result.results.forEach(doc => existingDocs.set(String(doc.sku), doc));
    } catch (e) {}

    let novos = 0, atualizados = 0, inalterados = 0;
    const incomingIds = new Set<string>();

    for (const prod of produtos) {
      // CORREÇÃO: Usando sku em vez de id
      const strId = String(prod.sku);
      incomingIds.add(strId);

      const exist = existingDocs.get(strId);
      if (!exist) {
        novos++;
      } else {
        const isEqual = JSON.stringify(prod) === JSON.stringify(exist);
        if (isEqual) {
          inalterados++;
        } else {
          atualizados++;
        }
      }
    }

    if (produtos.length > 0) {
      // CORREÇÃO: Informando ao Meilisearch que a Primary Key agora é sku
      await index.addDocuments(produtos, { primaryKey: 'sku' });
    }

    let removidos = 0;
    if (full_sync) {
      const idsToDelete: string[] = [];
      for (const [sku, _] of existingDocs.entries()) {
        if (!incomingIds.has(sku)) {
          idsToDelete.push(sku);
        }
      }

      if (idsToDelete.length > 0) {
        await index.deleteDocuments(idsToDelete);
        removidos = idsToDelete.length;
      }
    }

    return {
      mensagem: full_sync ? 'Sincronização completa realizada!' : 'Carga de produtos atualizada!',
      total_enviados: produtos.length,
      novos,
      atualizados,
      inalterados,
      ...(full_sync && { removidos_na_limpeza: removidos }) 
    };
  }

  // --- 3. BUSCA PRINCIPAL (VITRINE) ---
  
  async searchProdutosCatalogo(
    termo: string, 
    page: number, 
    limit: number,
    estado?: string, 
    apenasComEstoque?: string | boolean,
    brands?: string[], 
    categories?: string[],
    fornecedores?: string[], 
    segmentos?: string[], 
    sort?: string
  ) {
    const index = this.client.index('produtos');
    const offset = (page - 1) * limit;
    const filters: string[] = ["(isActive = 'S' OR isActive = 'true' OR isActive = 1)"];

    const comEstoque = String(apenasComEstoque) === 'true';
    if (estado === 'MA') {
      filters.push('uf_maranhao = "S"');
      if (comEstoque) filters.push('saldo_MA > 0');
    } else if (estado === 'TO') {
      filters.push('uf_tocantins = "S"');
      if (comEstoque) filters.push('saldo_TO > 0');
    } else if (estado === 'PA') {
      filters.push('uf_para = "S"');
      if (comEstoque) filters.push('saldo_PA > 0');
    } else if (comEstoque) {
      filters.push('quantityAvailable > 0'); 
    }

    const formatArrayFilter = (field: string, values: string[]) => {
      return `(${values.map(v => `${field} = "${v.trim()}"`).join(' OR ')})`;
    };

    if (brands && brands.length > 0) filters.push(formatArrayFilter('brand', brands));
    if (categories && categories.length > 0) filters.push(formatArrayFilter('categories', categories));
    if (fornecedores && fornecedores.length > 0) filters.push(formatArrayFilter('fornecedor', fornecedores));
    if (segmentos && segmentos.length > 0) filters.push(formatArrayFilter('segmento', segmentos));

    const sortRules: string[] = [];
    if (sort === 'menor-preco') sortRules.push('price:asc');
    else if (sort === 'maior-preco') sortRules.push('price:desc');

    const searchResult = await index.search(termo, {
      filter: filters.length > 0 ? filters.filter(Boolean).join(' AND ') : undefined,
      sort: sortRules.length > 0 ? sortRules : undefined,
      limit: limit,
      offset: offset,
      showRankingScore: true,
    });

    if (termo && termo.trim() !== '') {
      const log = this.historicoRepository.create({
        termo: termo.toLowerCase().trim(),
        quantidade_resultados: searchResult.hits.length,
      });
      this.historicoRepository.save(log).catch(() => {});
    }

    const produtosFormatados = searchResult.hits.map(hit => ({
      sku: hit.sku,
      name: hit.name,
      price: hit.price,
      image: hit.image,
      categories: hit.categories,
      brand: hit.brand,
      quantityAvailable: hit.quantityAvailable || 0,
      saldo_MA: hit.saldo_MA || 0,
      preco_sug_MA: hit.preco_sug_MA ?? null,
      uf_para: hit.uf_para ?? null,
      uf_tocantins: hit.uf_tocantins ?? null,
      uf_maranhao: hit.uf_maranhao ?? null,
      preco_sug_TO: hit.preco_sug_TO ?? null,
      saldo_TO: hit.saldo_TO || 0,
      preco_sug_PA: hit.preco_sug_PA ?? null,
      saldo_PA: hit.saldo_PA || 0,
      uf_nacional: hit.uf_nacional ?? null,
      preco_venda_nac: hit.preco_venda_nac ?? null,
      fornecedor: hit.fornecedor ?? null,
      segmento: hit.segmento ?? null,
      ranking: hit.ranking ?? null,
      embalagem: hit.embalagem ?? null,
      facing_atual_MA: hit.facing_atual_MA ?? null,
      facing_atual_TO: hit.facing_atual_TO ?? null,
      facing_atual_PA: hit.facing_atual_PA ?? null,
      facing_temp_TO: hit.facing_temp_TO ?? null,
      facing_temp_PA: hit.facing_temp_PA ?? null,
      custo_cd: hit.custo_cd ?? null,
      isActive: hit.isActive ?? 'S',
      _searchScore: hit._rankingScore ? Math.round(hit._rankingScore * 100) : 0,
    }));

    return { produtos: produtosFormatados };
  }

  // --- 4. FUNÇÕES DO PAINEL / PLAYGROUND ---

  async procurar(termo: string) {
    const index = this.client.index('produtos');
    const resultados = await index.search(termo, { limit: 20 });

    if (termo && termo.trim() !== '') {
      const log = this.historicoRepository.create({
        termo: termo.toLowerCase().trim(),
        quantidade_resultados: resultados.hits.length,
      });
      this.historicoRepository.save(log).catch(e => console.error('Erro ao salvar métrica', e));
    }

    return resultados.hits;
  }

  async listarProdutos() {
    const index = this.client.index('produtos');
    const stats = await index.getStats();
    const resultados = await index.search('', { limit: 5000 });

    return {
      produtos: resultados.hits,
      total_produtos: stats.numberOfDocuments
    };
  }

  async obterMetricas() {
    const totalPesquisas = await this.historicoRepository.count();

    const termosMaisBuscados = await this.historicoRepository
      .createQueryBuilder('historico')
      .select('historico.termo', 'termo')
      .addSelect('COUNT(historico.id)', 'quantidade')
      .groupBy('historico.termo')
      .orderBy('quantidade', 'DESC')
      .limit(10)
      .getRawMany();

    const pesquisasSemResultado = await this.historicoRepository
      .createQueryBuilder('historico')
      .select('historico.termo', 'termo')
      .addSelect('COUNT(historico.id)', 'quantidade')
      .where('historico.quantidade_resultados = 0')
      .groupBy('historico.termo')
      .orderBy('quantidade', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      total_pesquisas_realizadas: totalPesquisas,
      top_10_termos_buscados: termosMaisBuscados,
      top_10_pesquisas_sem_resultado: pesquisasSemResultado,
    };
  }
}