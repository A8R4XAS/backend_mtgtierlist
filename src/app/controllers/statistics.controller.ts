import { Context, Get, HttpResponseOK, HttpResponseBadRequest, UserRequired } from '@foal/core';
import { getRepository } from 'typeorm';
import { Participation } from '../entities';

export interface MonthlyStatistics {
  month: string;
  wins: number;
  losses: number;
  total: number;
}

export interface UserChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
  }[];
}

@UserRequired()
export class StatisticsController {

  @Get('/user/:userId/monthly')
  async getUserMonthlyStats(ctx: Context): Promise<HttpResponseOK | HttpResponseBadRequest> {
    try {
      const userId = parseInt(ctx.request.params.userId, 10);
      
      if (isNaN(userId)) {
        return new HttpResponseBadRequest('Invalid user ID');
      }

      const participationRepo = getRepository(Participation);
      
      // Hole alle Participations des Users aus den letzten 6 Monaten
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const participations = await participationRepo
        .createQueryBuilder('participation')
        .leftJoinAndSelect('participation.game', 'game')
        .leftJoinAndSelect('participation.user_deck', 'user_deck')
        .leftJoinAndSelect('user_deck.user', 'user')
        .where('user.id = :userId', { userId })
        .andWhere('game.createdAt >= :sixMonthsAgo', { sixMonthsAgo })
        .orderBy('game.createdAt', 'DESC')
        .getMany();

      // Gruppiere nach Monaten
      const monthlyStats: MonthlyStatistics[] = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = monthDate.toLocaleDateString('de-DE', { month: 'short' });
        
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthParticipations = participations.filter(p => {
          const gameDate = new Date(p.game.createdAt);
          return gameDate >= monthStart && gameDate <= monthEnd;
        });
        
        const wins = monthParticipations.filter(p => p.is_winner).length;
        const losses = monthParticipations.filter(p => !p.is_winner).length;
        
        monthlyStats.push({
          month: monthKey,
          wins,
          losses,
          total: wins + losses
        });
      }

      return new HttpResponseOK(monthlyStats);

    } catch (error) {
      console.error('Error fetching user monthly statistics:', error);
      return new HttpResponseBadRequest('Failed to fetch statistics');
    }
  }

  @Get('/user/:userId/chart-data')
  async getUserChartData(ctx: Context): Promise<HttpResponseOK | HttpResponseBadRequest> {
    try {
      const userId = parseInt(ctx.request.params.userId, 10);
      
      if (isNaN(userId)) {
        return new HttpResponseBadRequest('Invalid user ID');
      }

      const participationRepo = getRepository(Participation);
      
      // Hole alle Participations des Users aus den letzten 6 Monaten
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const participations = await participationRepo
        .createQueryBuilder('participation')
        .leftJoinAndSelect('participation.game', 'game')
        .leftJoinAndSelect('participation.user_deck', 'user_deck')
        .leftJoinAndSelect('user_deck.user', 'user')
        .where('user.id = :userId', { userId })
        .andWhere('game.createdAt >= :sixMonthsAgo', { sixMonthsAgo })
        .orderBy('game.createdAt', 'DESC')
        .getMany();

      // Erstelle Chart-Daten
      const labels: string[] = [];
      const winData: number[] = [];
      const lossData: number[] = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(monthDate.toLocaleDateString('de-DE', { month: 'short' }));
        
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthParticipations = participations.filter(p => {
          const gameDate = new Date(p.game.createdAt);
          return gameDate >= monthStart && gameDate <= monthEnd;
        });
        
        const wins = monthParticipations.filter(p => p.is_winner).length;
        const losses = monthParticipations.filter(p => !p.is_winner).length;
        
        winData.push(wins);
        lossData.push(losses);
      }

      const chartData: UserChartData = {
        labels,
        datasets: [
          {
            label: 'Siege',
            data: winData,
            backgroundColor: 'rgba(39, 174, 96, 0.2)',
            borderColor: '#27ae60'
          },
          {
            label: 'Niederlagen',
            data: lossData,
            backgroundColor: 'rgba(231, 76, 60, 0.2)',
            borderColor: '#e74c3c'
          }
        ]
      };

      return new HttpResponseOK(chartData);

    } catch (error) {
      console.error('Error fetching user chart data:', error);
      return new HttpResponseBadRequest('Failed to fetch chart data');
    }
  }

  @Get('/user/:userId/summary')
  async getUserSummary(ctx: Context): Promise<HttpResponseOK | HttpResponseBadRequest> {
    try {
      const userId = parseInt(ctx.request.params.userId, 10);
      
      if (isNaN(userId)) {
        return new HttpResponseBadRequest('Invalid user ID');
      }

      const participationRepo = getRepository(Participation);
      
      // Hole alle Participations des Users
      const participations = await participationRepo
        .createQueryBuilder('participation')
        .leftJoinAndSelect('participation.game', 'game')
        .leftJoinAndSelect('participation.user_deck', 'user_deck')
        .leftJoinAndSelect('user_deck.user', 'user')
        .where('user.id = :userId', { userId })
        .getMany();

      const totalGames = participations.length;
      const wins = participations.filter(p => p.is_winner).length;
      const losses = participations.filter(p => !p.is_winner).length;
      const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

      const summary = {
        totalGames,
        wins,
        losses,
        winRate
      };

      return new HttpResponseOK(summary);

    } catch (error) {
      console.error('Error fetching user summary:', error);
      return new HttpResponseBadRequest('Failed to fetch user summary');
    }
  }
}