import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { HistoricoBusca } from './historico.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HistoricoBusca])],
  providers: [SearchService],
  controllers: [SearchController]
})
export class SearchModule {}