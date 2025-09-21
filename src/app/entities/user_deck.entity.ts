import { BaseEntity, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { Deck } from './deck.entity';
import { Participation } from './participation.entity';

@Entity()
@Unique(['user', 'deck']) // A user can be in a specific combination with a deck only once
export class User_deck extends BaseEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.user_decks)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Deck, deck => deck.user_decks)
  @JoinColumn()
  deck: Deck;

  @OneToMany(() => Participation, participation => participation.user_deck)
  participations: Participation[];

}
