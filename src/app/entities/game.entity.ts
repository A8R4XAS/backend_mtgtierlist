// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BaseEntity, Entity, PrimaryGeneratedColumn, ManyToOne, Column, OneToMany } from 'typeorm';
import { Participation } from './participation.entity';

@Entity()
export class Game extends BaseEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => Participation, participation => participation.game)
  participations: Participation[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

}
