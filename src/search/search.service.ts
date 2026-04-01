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
      host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
      apiKey: process.env.MEILISEARCH_KEY || 'Senha@123!', 
    });
  }

  async onModuleInit() {
    console.log('⏳ Configurando regras base do Meilisearch...');
    const index = this.client.index('produtos');

    await index.updateSettings({
      dictionary: ['d+'], 
      nonSeparatorTokens: ['+'], 
    });

    await index.updateTypoTolerance({
      enabled: true,
      minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 }
    });

    await index.updateSearchableAttributes([
      'sku', 'name', 'brand', 'categories', 'fornecedor', 'segmento'
    ]);

    console.log('✅ Regras base configuradas!');
  }

  // 1. Atualizar Sinônimos
  async atualizarSinonimos(sinonimos: Record<string, string[]>) {
    const index = this.client.index('produtos');
    return await index.updateSynonyms(sinonimos);
  }

  // 2. Listar Sinônimos Atuais
  async listarSinonimos() {
    const index = this.client.index('produtos');
    return await index.getSynonyms();
  }

  // 3. Indexar Produtos
  async indexarProdutos(produtos: any[]) {
    const index = this.client.index('produtos');
    return await index.addDocuments(produtos, { primaryKey: 'id' });
  }

  // 4. Buscar com termo
async procurar(termo: string) {
    const index = this.client.index('produtos');
    const resultados = await index.search(termo, { limit: 20 });

    // Salva a métrica no SQLite de forma ASSÍNCRONA (não trava a resposta para o usuário)
    if (termo && termo.trim() !== '') {
      const log = this.historicoRepository.create({
        termo: termo.toLowerCase().trim(),
        quantidade_resultados: resultados.hits.length,
      });
      this.historicoRepository.save(log).catch(e => console.error('Erro ao salvar métrica', e));
    }

    return resultados.hits;
  }

  // 5. NOVO: Listar todos os produtos cadastrados (limite de 100 para não sobrecarregar)
  async listarProdutos() {
    const index = this.client.index('produtos');
    // Faz uma busca vazia para trazer tudo o que está indexado
    const resultados = await index.search('', { limit: 100 });
    return resultados.hits;
  }
async obterMetricas() {
    // 1. Total de pesquisas realizadas
    const totalPesquisas = await this.historicoRepository.count();

    // 2. Top 10 Termos mais buscados (Agrupa e conta com SQL puro)
    const termosMaisBuscados = await this.historicoRepository
      .createQueryBuilder('historico')
      .select('historico.termo', 'termo')
      .addSelect('COUNT(historico.id)', 'quantidade')
      .groupBy('historico.termo')
      .orderBy('quantidade', 'DESC')
      .limit(10)
      .getRawMany();

    // 3. Pesquisas que não retornaram resultados (Oportunidade de adicionar sinônimos ou produtos novos!)
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