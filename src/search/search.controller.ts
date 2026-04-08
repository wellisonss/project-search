import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('busca')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('sinonimos')
  async salvarSinonimos(@Body() body: Record<string, string[]>) {
    await this.searchService.atualizarSinonimos(body);
    return { mensagem: 'Sinônimos enviados para o motor de busca com sucesso!' };
  }

  @Get('sinonimos')
  async verSinonimos() {
    return await this.searchService.listarSinonimos();
  }

  @Post('produtos')
  async indexarProdutos(@Body() produtos: any[]) {
    await this.searchService.indexarProdutos(produtos);
    return { mensagem: `${produtos.length} produto(s) enviado(s) para o índice!` };
  }

  @Get()
  async pesquisar(@Query('q') query: string) {
    if (!query) return { resultados: [] };
    const hits = await this.searchService.procurar(query);
    return { resultados: hits };
  }

  // NOVO: Rota que junta e mostra tudo o que está dentro do Meilisearch
  @Get('cadastrados')
    async listarCadastrados() {
      const resultado = await this.searchService.listarProdutos();
      
      return {
        // ALTERADO: O Service agora devolve um objeto com a chave 'produtos'
        produtos: resultado.produtos,
        // ALTERADO: O total real já vem calculado pelo Service
        total_produtos: resultado.total_produtos,
      };
    }

  @Get('metricas')
  async verMetricas() {
    return await this.searchService.obterMetricas();
  }
  
}