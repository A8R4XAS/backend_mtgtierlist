// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Deck } from './deck.entity';
import { User } from './user.entity';

@Entity()
@Unique(['deck', 'rater']) // A user can rate a specific deck only once
export class DeckEvaluation extends BaseEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Deck, deck => deck.evaluations)
  deck: Deck;

  @ManyToOne(() => User, user => user.deckEvaluations, { nullable: true })
  rater?: User;

  @Column({ type: 'int' })
  value: number;

}
