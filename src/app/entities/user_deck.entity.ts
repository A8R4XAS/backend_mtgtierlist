import { BaseEntity, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Deck } from './deck.entity';
import { Participation } from './participation.entity';

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

  @OneToMany(() => Participation, participation => participation.user_deck)
  participations: Participation[];

}
