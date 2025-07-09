// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Deck extends BaseEntity {

  @PrimaryGeneratedColumn()
  id: number;

}
