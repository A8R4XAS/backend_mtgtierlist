import { Context, Get, HttpResponseOK, HttpResponseBadRequest } from '@foal/core';
import { JWTRequired } from '@foal/jwt';
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

export class StatisticsController {

  @Get('/user/:userId/monthly')
  @JWTRequired()
  async getUserMonthlyStats(ctx: Context): Promise<HttpResponseOK | HttpResponseBadRequest> {
    try {
      const userId = parseInt(ctx.request.params.userId, 10);
      
      if (isNaN(userId)) {
        return new HttpResponseBadRequest('Invalid user ID');
      }
      
      // Hole alle Participations des Users aus den letzten 6 Monaten
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const participations = await Participation
        .createQueryBuilder('participation')
        .leftJoinAndSelect('participation.game', 'game')
        .leftJoinAndSelect('participation.user_deck', 'user_deck')
        .leftJoinAndSelect('user_deck.user', 'user')
        .where('user.id = :userId', { userId })
        .andWhere('game.createdAt >= :sixMonthsAgo', { sixMonthsAgo })
        .orderBy('game.createdAt', 'DESC')
        .getMany();
        
      console.log(`Found ${participations.length} participations for user ${userId} in monthly stats`);

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new HttpResponseBadRequest(`Failed to fetch statistics: ${errorMessage}`);
    }
  }

  @Get('/user/:userId/chart-data')
  @JWTRequired()
  async getUserChartData(ctx: Context): Promise<HttpResponseOK | HttpResponseBadRequest> {
    try {
      const userId = parseInt(ctx.request.params.userId, 10);
      
      if (isNaN(userId)) {
        return new HttpResponseBadRequest('Invalid user ID');
      }
      
      // Hole ALLE Participations des Users (ohne Zeitbegrenzung für dynamische Skalierung)
      const participations = await Participation
        .createQueryBuilder('participation')
        .leftJoinAndSelect('participation.game', 'game')
        .leftJoinAndSelect('participation.user_deck', 'user_deck')
        .leftJoinAndSelect('user_deck.user', 'user')
        .where('user.id = :userId', { userId })
        .orderBy('game.createdAt', 'ASC')
        .getMany();
        
      console.log(`Found ${participations.length} participations for user ${userId} in chart-data`);

      // Wenn keine Spiele vorhanden, leere Daten zurückgeben
      if (participations.length === 0) {
        return new HttpResponseOK({
          labels: [],
          datasets: [
            {
              label: 'Siege',
              data: [],
              backgroundColor: 'rgba(39, 174, 96, 0.2)',
              borderColor: '#27ae60'
            },
            {
              label: 'Niederlagen',
              data: [],
              backgroundColor: 'rgba(231, 76, 60, 0.2)',
              borderColor: '#e74c3c'
            }
          ]
        });
      }

      // Ermittle Zeitspanne der Spiele
      const firstGameDate = new Date(participations[0].game.createdAt);
      const lastGameDate = new Date(participations[participations.length - 1].game.createdAt);
      const daysDiff = Math.floor((lastGameDate.getTime() - firstGameDate.getTime()) / (1000 * 60 * 60 * 24));

      // Dynamische Skalierung basierend auf Zeitspanne
      let labels: string[] = [];
      let winData: number[] = [];
      let lossData: number[] = [];

      if (daysDiff <= 7) {
        // Weniger als 1 Woche: Tages-Ansicht
        const dateMap = new Map<string, { wins: number, losses: number }>();
        
        participations.forEach(p => {
          const gameDate = new Date(p.game.createdAt);
          const dateKey = gameDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
          
          if (!dateMap.has(dateKey)) {
            dateMap.set(dateKey, { wins: 0, losses: 0 });
          }
          
          const stats = dateMap.get(dateKey)!;
          if (p.is_winner) {
            stats.wins++;
          } else {
            stats.losses++;
          }
        });

        labels = Array.from(dateMap.keys());
        winData = Array.from(dateMap.values()).map(v => v.wins);
        lossData = Array.from(dateMap.values()).map(v => v.losses);

      } else if (daysDiff <= 60) {
        // 1 Woche bis 2 Monate: Wochen-Ansicht
        const weekMap = new Map<string, { wins: number, losses: number }>();
        
        participations.forEach(p => {
          const gameDate = new Date(p.game.createdAt);
          // Berechne Woche im Jahr
          const weekStart = new Date(gameDate);
          weekStart.setDate(gameDate.getDate() - gameDate.getDay());
          const weekKey = `KW${Math.ceil((gameDate.getTime() - new Date(gameDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
          
          if (!weekMap.has(weekKey)) {
            weekMap.set(weekKey, { wins: 0, losses: 0 });
          }
          
          const stats = weekMap.get(weekKey)!;
          if (p.is_winner) {
            stats.wins++;
          } else {
            stats.losses++;
          }
        });

        labels = Array.from(weekMap.keys());
        winData = Array.from(weekMap.values()).map(v => v.wins);
        lossData = Array.from(weekMap.values()).map(v => v.losses);

      } else {
        // Mehr als 2 Monate: Monats-Ansicht
        const monthMap = new Map<string, { wins: number, losses: number }>();
        
        participations.forEach(p => {
          const gameDate = new Date(p.game.createdAt);
          const monthKey = gameDate.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
          
          if (!monthMap.has(monthKey)) {
            monthMap.set(monthKey, { wins: 0, losses: 0 });
          }
          
          const stats = monthMap.get(monthKey)!;
          if (p.is_winner) {
            stats.wins++;
          } else {
            stats.losses++;
          }
        });

        labels = Array.from(monthMap.keys());
        winData = Array.from(monthMap.values()).map(v => v.wins);
        lossData = Array.from(monthMap.values()).map(v => v.losses);
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new HttpResponseBadRequest(`Failed to fetch chart data: ${errorMessage}`);
    }
  }

  @Get('/user/:userId/summary')
  @JWTRequired()
  async getUserSummary(ctx: Context): Promise<HttpResponseOK | HttpResponseBadRequest> {
    try {
      const userId = parseInt(ctx.request.params.userId, 10);
      
      if (isNaN(userId)) {
        return new HttpResponseBadRequest('Invalid user ID');
      }
      
      // Hole alle Participations des Users
      const participations = await Participation
        .createQueryBuilder('participation')
        .leftJoinAndSelect('participation.game', 'game')
        .leftJoinAndSelect('participation.user_deck', 'user_deck')
        .leftJoinAndSelect('user_deck.user', 'user')
        .where('user.id = :userId', { userId })
        .getMany();
        
      console.log(`Found ${participations.length} total participations for user ${userId}`);

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new HttpResponseBadRequest(`Failed to fetch user summary: ${errorMessage}`);
    }
  }
}