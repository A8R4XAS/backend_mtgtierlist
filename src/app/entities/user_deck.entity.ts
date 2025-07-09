// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User_deck extends BaseEntity {

  @PrimaryGeneratedColumn()
  id: number;

}
