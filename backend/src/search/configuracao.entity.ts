import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('configuracoes_busca')
export class ConfiguracaoBusca {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ default: true })
  usar_ia!: boolean;

  @Column('simple-array', { 
    default: 'name,brand,categories,sku,fornecedor,segmento' 
  })
  ordem_atributos!: string[];
}