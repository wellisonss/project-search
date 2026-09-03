import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { HistoricoBusca } from './historico.entity';
import { ConfiguracaoBusca } from './configuracao.entity';
import { PovoamentoService } from './povoamento.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([HistoricoBusca, ConfiguracaoBusca])
  ],
  providers: [SearchService, PovoamentoService],
  controllers: [SearchController]
})
export class SearchModule {}