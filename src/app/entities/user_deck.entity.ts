import { BaseEntity, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Deck } from './deck.entity';
import { Game } from './game.entity';

@Entity()
export class User_deck extends BaseEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.user_decks)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Deck, deck => deck.user_decks)
  @JoinColumn()
  deck: Deck;

  @OneToMany(() => Game, game => game.user_deck1)
  games1: Game[];

  @OneToMany(() => Game, game => game.user_deck2)
  games2: Game[];

  @OneToMany(() => Game, game => game.user_deck3)
  games3: Game[];

  @OneToMany(() => Game, game => game.user_deck4)
  games4: Game[];

  @OneToMany(() => Game, game => game.winner)
  winner: Game[];

  

}
