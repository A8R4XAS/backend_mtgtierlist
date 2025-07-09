// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BaseEntity, Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User_deck } from './user_deck.entity.js';
import { Deck } from './deck.entity.js';

@Entity()
export class User extends BaseEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true})
  email : string;

  @Column()
  password: string;

  @Column()
  name: string;

  @OneToMany(() => Deck, deck => deck.owner)
  decks: Deck[];

  @OneToMany(() => User_deck, user_deck => user_deck.user)
  user_decks: User_deck[];

}

//This line is required. It will be used to create the SQL session table
export { DatabaseSession } from '@foal/typeorm';
