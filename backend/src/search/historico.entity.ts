import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('historico_buscas')
export class HistoricoBusca {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  termo!: string;

  @Column()
  quantidade_resultados!: number;

  @CreateDateColumn()
  data_hora!: Date;
}