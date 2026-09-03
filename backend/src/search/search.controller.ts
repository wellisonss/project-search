import { Controller, Get, Post, Put, Delete, Query, Body, Param, BadRequestException, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { PovoamentoService } from './povoamento.service';
import { SecretGuard } from './secret.guard';

@Controller('products')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly povoamentoService: PovoamentoService,
  ) {}

  // ==========================================
  // POVOAMENTO A PARTIR DE LISTA DE PREÇO (busca-produtos na API principal)
  // ==========================================
  @Post('povoar-por-lista')
  @UseGuards(SecretGuard)
  async povoarPorLista(@Body() body: { priceListVersionIds?: number[] }) {
    let ids = body?.priceListVersionIds;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      // Sem lista explícita no body: cai para PROJECT_SEARCH_PRICE_LIST_IDS (ex.: "5000088,5000089").
      const fromEnv = process.env.PROJECT_SEARCH_PRICE_LIST_IDS;
      ids = fromEnv ? fromEnv.split(',').map((v) => Number(v.trim())).filter((v) => Number.isInteger(v) && v > 0) : [];
    }
    if (ids.length === 0) {
      throw new BadRequestException(
        'Informe "priceListVersionIds" no body, ou configure PROJECT_SEARCH_PRICE_LIST_IDS.',
      );
    }
    return await this.povoamentoService.povoarPorListaPreco(ids);
  }

  // ==========================================
  // NOVAS ROTAS DE CONFIGURAÇÃO DO MOTOR
  // ==========================================
  @Get('config')
  async verConfiguracoes() {
    return await this.searchService.obterConfiguracoes();
  }

  @Put('config/ia')
  @UseGuards(SecretGuard)
  async configurarIA(@Body() body: { usar_ia: boolean }) {
    if (typeof body.usar_ia !== 'boolean') {
      throw new BadRequestException('O campo "usar_ia" deve ser um booleano (true/false).');
    }
    return await this.searchService.alternarIA(body.usar_ia);
  }

  @Put('config/atributos')
  @UseGuards(SecretGuard)
  async configurarAtributosBusca(@Body() body: { ordem: string[] }) {
    if (!body.ordem || !Array.isArray(body.ordem) || body.ordem.length === 0) {
      throw new BadRequestException('Você deve fornecer um array de strings no campo "ordem".');
    }
    return await this.searchService.atualizarOrdemAtributos(body.ordem);
  }

  // ==========================================
  // ROTA PARA LIMPAR O MOTOR
  // ==========================================
  @Delete('limpar')
  @UseGuards(SecretGuard)
  async limparMotor() {
    return await this.searchService.limparMotor();
  }

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
    const parsedBrands = brands ? brands.split(',') : [];
    const parsedCategories = categories ? categories.split(',') : [];
    const parsedFornecedores = fornecedores ? fornecedores.split(',') : [];
    const parsedSegmentos = segmentos ? segmentos.split(',') : [];

    return await this.searchService.searchProdutosCatalogo(
      termo ?? '', 
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
  @UseGuards(SecretGuard)
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
  @UseGuards(SecretGuard)
  async salvarSinonimos(@Body() body: Record<string, string[]>) {
    await this.searchService.atualizarSinonimos(body);
    return { mensagem: 'Sinónimos enviados com sucesso!' };
  }

  @Get('sinonimos')
  async verSinonimos() {
    return await this.searchService.listarSinonimos();
  }

  @Delete('sinonimos/:palavra')
  @UseGuards(SecretGuard)
  async excluirUmSinonimo(@Param('palavra') palavra: string) {
    const resultado = await this.searchService.removerUmSinonimo(palavra);

    if (!resultado) {
      throw new BadRequestException(`O sinónimo para '${palavra}' não foi encontrado.`);
    }

    return { mensagem: `A regra de sinónimo para '${palavra}' foi removida com sucesso!` };
  }

  @Delete('sinonimos')
  @UseGuards(SecretGuard)
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