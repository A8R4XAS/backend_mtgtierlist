import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity.js';
import { User_deck } from './user_deck.entity.js';

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

}


