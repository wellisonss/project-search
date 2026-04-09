import { Controller, Get, Post, Delete, Query, Body, Param, BadRequestException } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('products')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // ==========================================
  // ROTA PRINCIPAL DE BUSCA (VITRINE)
  // ==========================================
  @Get('search')
  async vitrineSearch(
    @Query('termo') termo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('estado') estado?: string,
    @Query('apenasComEstoque') apenasComEstoque?: string,
    @Query('brands') brands?: string,
    @Query('categories') categories?: string,
    @Query('fornecedores') fornecedores?: string,
    @Query('segmentos') segmentos?: string,
    @Query('sort') sort?: string,
  ) {
    // Garante que, se for null ou undefined, vira um array vazio
    const parsedBrands = brands ? brands.split(',') : [];
    const parsedCategories = categories ? categories.split(',') : [];
    const parsedFornecedores = fornecedores ? fornecedores.split(',') : [];
    const parsedSegmentos = segmentos ? segmentos.split(',') : [];

    return await this.searchService.searchProdutosCatalogo(
      termo ?? '', // Se for nulo, passa uma string vazia (resolve o erro)
      page ? Number(page) : 1, 
      limit ? Number(limit) : 70, 
      estado ?? undefined, 
      apenasComEstoque ?? undefined,
      parsedBrands, 
      parsedCategories, 
      parsedFornecedores, 
      parsedSegmentos, 
      sort ?? 'mais-populares'
    );
  }

  // ==========================================
  // ROTA DE POVOAMENTO (SINC DE PRODUTOS)
  // ==========================================
  @Post('produtos')
  async indexarProdutos(@Body() body: any) {
    const payload = Array.isArray(body) 
      ? { full_sync: false, produtos: body } 
      : body;

    if (!payload.produtos || !Array.isArray(payload.produtos)) {
      throw new BadRequestException('O payload deve conter um array de "produtos"');
    }

    return await this.searchService.indexarProdutos(payload);
  }

  // ==========================================
  // ROTAS DE GESTÃO DE SINÓNIMOS
  // ==========================================
  
  @Post('sinonimos')
  async salvarSinonimos(@Body() body: Record<string, string[]>) {
    await this.searchService.atualizarSinonimos(body);
    return { mensagem: 'Sinónimos enviados com sucesso!' };
  }

  @Get('sinonimos')
  async verSinonimos() {
    return await this.searchService.listarSinonimos();
  }

  @Delete('sinonimos/:palavra')
  async excluirUmSinonimo(@Param('palavra') palavra: string) {
    const resultado = await this.searchService.removerUmSinonimo(palavra);
    
    if (!resultado) {
      throw new BadRequestException(`O sinónimo para '${palavra}' não foi encontrado.`);
    }

    return { mensagem: `A regra de sinónimo para '${palavra}' foi removida com sucesso!` };
  }

  @Delete('sinonimos')
  async excluirTodosSinonimos() {
    await this.searchService.resetarSinonimos();
    return { mensagem: 'Todos os sinónimos foram removidos com sucesso!' };
  }

  // ==========================================
  // ROTAS ADMINISTRATIVAS E MÉTRICAS
  // ==========================================

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