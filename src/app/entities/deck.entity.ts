import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { User_deck } from './user_deck.entity';
import { DeckEvaluation } from './Deck-evaluation.entity';

@Entity()
export class Deck extends BaseEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.decks,{ nullable: true })
  @JoinColumn()
  owner: User;

  @Column({ nullable: true })
  commander: string;

  @Column({ nullable: true })
  thema: string;

  @Column({ nullable: true })
  gameplan: string;

  /*
  @Column({
    type: 'enum',
    enum: Tempo,
    default: Tempo.MEDIUM
  })
  tempo: number;
*/

  @Column({ nullable: true })
  tempo: string;

  @Column({ nullable: true })
  tier: number;

  @Column({ nullable: true })
  weaknesses: string;

  @OneToMany(() => User_deck, user_deck => user_deck.deck,{ nullable: true })
  user_decks: User_deck[];

  @OneToMany(() => DeckEvaluation, deck => deck.deck)
  evaluations: DeckEvaluation[];

}


