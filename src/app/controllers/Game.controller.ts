import { Context, Delete, Get, HttpResponseBadRequest, HttpResponseCreated, HttpResponseInternalServerError, HttpResponseNoContent, HttpResponseNotFound, HttpResponseOK, Post, ValidatePathParam } from '@foal/core';
import { JWTRequired } from '@foal/jwt';
import { Game } from '../entities/index';

export class GameController {

  @Get('/')
  @JWTRequired()
  async getGames() {
    // Spiele mit ihren Teilnahmen laden
    const games = await Game.find({ relations: ['participations'] });
    if (!games) return new HttpResponseOK([]);
    return new HttpResponseOK(games);
  }

  @Post('/')
  @JWTRequired()
  async postGame(ctx: Context) {
    try {
      const game = new Game();
      await game.save();
      return new HttpResponseCreated(game);
    } catch (error) {
      return new HttpResponseBadRequest(error);
    }
  }

  @Delete('/:id')
  @JWTRequired()
  async deleteGame(ctx: Context) {
    const game = await Game.findOneBy({ id: ctx.request.params.id });
    if (!game) return new HttpResponseNotFound();
    await game.remove();
    return new HttpResponseNoContent();
  }

  @Get('/:id')
  @JWTRequired()
  @ValidatePathParam('id', { type: 'number' })
  async getGame(ctx: Context) {
    try {
      const game = await Game.findOne({
        where: { id: ctx.request.params.id }
      });
      if (!game) return new HttpResponseOK([]);
      return new HttpResponseOK(game);
    } catch (error) {
      console.error('Fehler beim Laden des Spiels:', error);
      return new HttpResponseInternalServerError('Serverfehler beim Laden des Spiels');
    }
  }

  @Get('/user/:userId')
  @JWTRequired()
  async getGamesByUser(ctx: Context) {
    try {
      const userId = Number(ctx.request.params.userId);
      
      // Spiele mit Teilnahmen laden, bei denen der angegebene Benutzer beteiligt ist
      const games = await Game.createQueryBuilder('game')
        .leftJoinAndSelect('game.participations', 'participation')
        .leftJoinAndSelect('participation.user_deck', 'user_deck')
        .leftJoinAndSelect('user_deck.user', 'user')
        .where('user.id = :userId', { userId })
        .getMany();

      return new HttpResponseOK(games);
    } catch (error) {
      console.error('Fehler beim Laden der Spiele des Benutzers:', error);
      return new HttpResponseInternalServerError('Serverfehler beim Laden der Spiele');
    }
  }

}