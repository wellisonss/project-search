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
    console.log('⏳ Aplicando Configurações Avançadas de Tolerância e Relevância...');
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
      // Colocamos 'typo' no topo para garantir que erros de digitação não excluam o produto
      rankingRules: [
        'words',
        'typo',      // <--- Prioridade para tolerância a erros
        'proximity',
        'attribute',
        'sort',
        'exactness',
      ],

      // 3. Atributos Pesquisáveis
      searchableAttributes: [
        'sku', 'name', 'brand', 'categories', 'fornecedor', 'segmento'
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

  // 1. Atualizar Sinónimos
  async atualizarSinonimos(sinonimos: Record<string, string[]>) {
    const index = this.client.index('produtos');
    return await index.updateSynonyms(sinonimos);
  }

  // 2. Listar Sinónimos Atuais
  async listarSinonimos() {
    const index = this.client.index('produtos');
    return await index.getSynonyms();
  }

  // 3. Indexar Produtos (Com Sincronização Inteligente)
  async indexarProdutos(payload: { full_sync: boolean; produtos: any[] }) {
    const index = this.client.index('produtos');
    const { full_sync, produtos } = payload;

    // 1. Obter documentos atuais para fazer a comparação (Diff)
    const existingDocs = new Map<string, any>();
    try {
      // Puxamos um limite alto para comparar na memória
      const result = await index.getDocuments({ limit: 100000 });
      result.results.forEach(doc => existingDocs.set(String(doc.id), doc));
    } catch (e) {
      // Se o índice estiver vazio ou ainda não existir, ignoramos silenciosamente
    }

    let novos = 0;
    let atualizados = 0;
    let inalterados = 0;
    const incomingIds = new Set<string>();

    // 2. Classificação: Novo, Atualizado ou Inalterado
    for (const prod of produtos) {
      const strId = String(prod.id);
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

    // 3. Adicionar/Atualizar documentos (O Meilisearch faz upsert automático pela Primary Key)
    if (produtos.length > 0) {
      await index.addDocuments(produtos, { primaryKey: 'id' });
    }

    // 4. Executar Full Sync (Deletar o que está no Meilisearch, mas não veio na carga atual)
    let removidos = 0;
    if (full_sync) {
      const idsToDelete: string[] = [];
      
      for (const [id, _] of existingDocs.entries()) {
        if (!incomingIds.has(id)) {
          idsToDelete.push(id);
        }
      }

      if (idsToDelete.length > 0) {
        await index.deleteDocuments(idsToDelete);
        removidos = idsToDelete.length;
      }
    }

    // 5. Retornar as métricas da operação
    return {
      mensagem: full_sync ? 'Sincronização completa realizada!' : 'Carga de produtos atualizada!',
      total_enviados: produtos.length,
      novos,
      atualizados,
      inalterados,
      ...(full_sync && { removidos_na_limpeza: removidos }) 
    };
  }

  // 4. Procurar (Utilizado no Playground de Teste)
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

  // 5. Listar Produtos com Contador Real para o Painel
  async listarProdutos() {
    const index = this.client.index('produtos');
    
    // Pega as estatísticas reais para o contador do topo da página
    const stats = await index.getStats();

    // Faz a busca (vazia) para a tabela com limite alto para a paginação local
    const resultados = await index.search('', { limit: 5000 });

    return {
      produtos: resultados.hits,
      total_produtos: stats.numberOfDocuments
    };
  }

  // 6. Obter Métricas para o Dashboard
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