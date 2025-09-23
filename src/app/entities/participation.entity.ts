// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Game } from './game.entity';
import { User_deck } from './user_deck.entity';
import { Rating } from './rating_participation.entity';

@Entity()
export class Participation extends BaseEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Game, game => game.participations)
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @ManyToOne(() => User_deck, user_deck => user_deck.participations)
  @JoinColumn([
    { name: 'user_id', referencedColumnName: 'user_id' },
    { name: 'deck_id', referencedColumnName: 'deck_id' }
  ])
  userDeck: User_deck;

  //Rating
  @OneToMany(() => Rating, rating => rating.participation)
  ratings: Rating[];

  @Column({type: 'boolean', default: false})
  is_winner: boolean;

}
