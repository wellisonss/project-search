import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { HistoricoBusca } from './historico.entity';
import { ConfiguracaoBusca } from './configuracao.entity'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([HistoricoBusca, ConfiguracaoBusca]) 
  ],
  providers: [SearchService],
  controllers: [SearchController]
})
export class SearchModule {}