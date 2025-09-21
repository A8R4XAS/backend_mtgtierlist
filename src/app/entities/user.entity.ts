// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BaseEntity, Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User_deck } from './user_deck.entity';
import { Deck } from './deck.entity';
import { Rating } from './rating_participation.entity';
import { DeckEvaluation } from './Deck-evaluation.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

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

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role: UserRole;

  // a User can have many Decks
  @OneToMany(() => Deck, deck => deck.owner)
  decks: Deck[];

  // a User can have many User_deck combinations
  @OneToMany(() => User_deck, user_deck => user_deck.user)
  user_decks: User_deck[];

  @OneToMany(() => Rating, rating => rating.rater)
  ratings: Rating[];

  @OneToMany(() => DeckEvaluation, deckEvaluation => deckEvaluation.rater)
  deckEvaluations: DeckEvaluation[];

}

//This line is required. It will be used to create the SQL session table
export { DatabaseSession } from '@foal/typeorm';
