import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Participation } from './participation.entity';
import { User } from './user.entity';

@Entity()
@Unique(['participation', 'rater']) // Unique Constraint hinzufügen
export class Rating extends BaseEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Participation, participation => participation.ratings)
  @JoinColumn({ name: 'participation_id' })
  participation: Participation;

  @ManyToOne(() => User, user => user.ratings)
  @JoinColumn({ name: 'rater_id' })
  rater: User;

  @Column({type: 'int'})
  value: number;


}
