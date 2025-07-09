// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BaseEntity, Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { User_deck } from './user_deck.entity.js';

@Entity()
export class Game extends BaseEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User_deck, User_deck => User_deck.games1)
  user_deck1: User_deck;

  @ManyToOne(() => User_deck, User_deck => User_deck.games2)
  user_deck2: User_deck;

  @ManyToOne(() => User_deck, User_deck => User_deck.games3)
  user_deck3: User_deck | null;

  @ManyToOne(() => User_deck, User_deck => User_deck.games4)
  user_deck4: User_deck | null;

  @ManyToOne(() => User_deck, User_deck => User_deck.winner)
  winner: User_deck | null;

}
