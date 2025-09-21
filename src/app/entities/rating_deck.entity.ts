import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Participation } from './participation.entity';
import { User } from './user.entity';

@Entity()
export class Rating extends BaseEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Participation, participation => participation.ratings)
  participation: Participation;

  @ManyToOne(() =>  User, user => user.ratings)
  rater: User;

  @Column({type: 'int'})
  value: number;


}
