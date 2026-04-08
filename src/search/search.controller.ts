import { Controller, Get, Post, Query, Body, BadRequestException } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('busca')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('sinonimos')
  async salvarSinonimos(@Body() body: Record<string, string[]>) {
    await this.searchService.atualizarSinonimos(body);
    return { mensagem: 'Sinónimos enviados com sucesso!' };
  }

  @Get('sinonimos')
  async verSinonimos() {
    return await this.searchService.listarSinonimos();
  }

  @Post('produtos')
  async indexarProdutos(@Body() body: any) {
    // 1. Adapta o payload caso mandem apenas um array direto (compatibilidade)
    const payload = Array.isArray(body) 
      ? { full_sync: false, produtos: body } 
      : body;

    // 2. Valida se a propriedade produtos existe
    if (!payload.produtos || !Array.isArray(payload.produtos)) {
      throw new BadRequestException('O payload deve conter um array de "produtos"');
    }

    // 3. Chama o Service (onde está a ligação real à base de dados e ao Meilisearch)
    const resultado = await this.searchService.indexarProdutos(payload);
    return resultado;
  }

  @Get()
  async pesquisar(@Query('q') query: string) {
    if (!query) return { resultados: [] };
    const hits = await this.searchService.procurar(query);
    return { resultados: hits };
  }

  @Get('cadastrados')
  async listarCadastrados() {
    const resultado = await this.searchService.listarProdutos();
    
    return {
      produtos: resultado.produtos,
      total_produtos: resultado.total_produtos,
    };
  }

  @Get('metricas')
  async verMetricas() {
    return await this.searchService.obterMetricas();
  }
}