// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BaseEntity, Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { User_deck } from './user_deck.entity';

@Entity()
export class Game extends BaseEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User_deck, User_deck => User_deck.games1)
  user_deck1: User_deck;

  @ManyToOne(() => User_deck, User_deck => User_deck.games2)
  user_deck2: User_deck;

  @ManyToOne(() => User_deck, User_deck => User_deck.games3, { nullable: true })
  user_deck3: User_deck;

  @ManyToOne(() => User_deck, User_deck => User_deck.games4, { nullable: true })
  user_deck4: User_deck;

  @ManyToOne(() => User_deck, User_deck => User_deck.winner, { nullable: true })
  winner: User_deck;

}
