import { Context, Get, Post, Put, Delete, HttpResponseOK, HttpResponseNoContent, ValidateBody, HttpResponseCreated, HttpResponseBadRequest } from '@foal/core';
import { Participation } from '../entities/participation.entity';
import { Deck, Game, User, User_deck } from '../entities';

/**
 * Check if a user_deck already exists. If not, create a new one.
 */
async function check(user: number, deck: number): Promise<User_deck> {
  try {
    let user_deck = await User_deck.findOne({
      relations: ['user', 'deck'],
      where: { user: { id: user }, deck: { id: deck } }
    });

    if (!user_deck) {
      user_deck = new User_deck();
      user_deck.user = await User.findOneByOrFail({ id: user });
      user_deck.deck = await Deck.findOneByOrFail({ id: deck });
      return await user_deck.save();
    }

    return user_deck;
  } catch (error) {
    console.log(error);
    throw error;
  }
}


export class ParticipationController {

  @Get('/')
  async findAll() {

    try {
      const items = await Participation.find({relations: ['user_deck', 'user_deck.user', 'user_deck.deck', 'game']});
      if (!items) return new HttpResponseOK([]);
      return new HttpResponseOK(items);
    } catch (error) {
      console.log(error);
      return new HttpResponseBadRequest(error);
    }
    
  }

  @Get('/:id')
  async findById(ctx: Context) {
    const item = await Participation.findOne({
      relations: ['user_deck', 'user_deck.user', 'user_deck.deck', 'game'],
      where: { id: ctx.request.params.id }
    });
    if (!item) return new HttpResponseNoContent();
    return new HttpResponseOK(item);
  } 

  @Post('/')
  @ValidateBody({
    type: 'object',
    properties: {
      user_deck: { type: 'number' },
      game: { type: 'number' },
      is_Winner: { type: 'boolean' }
    },
    required: ['user_deck', 'game'],
    additionalProperties: false,
  })
  async create(ctx: Context) {
    const {user, deck, game} = ctx.request.body;

    try {
      const user_deck = await check(user, deck);
      const gameExist = await Game.findOneByOrFail({ id: game });

      const participation = new Participation();
      participation.user_deck = user_deck;
      participation.game = gameExist;
      participation.is_winner = ctx.request.body.is_winner || false;

      await participation.save();
      return new HttpResponseCreated(participation);
    } catch (error) {
      console.log(error);
      return new HttpResponseBadRequest(error);
    }
  }

  @Put('/:id')
  @ValidateBody({
    type: 'object',
    properties: {
      is_winner: { type: 'boolean' },
      game: { type: 'number' },
      user_deck: { type: 'number' }
    },
    required: [],
    additionalProperties: false
  })
  async update(ctx: Context) {
    const entity = await Participation.findOneBy({ id: ctx.request.params.id });
    if (!entity) return new HttpResponseNoContent();

    const { is_Winner, game, user_deck } = ctx.request.body;
    entity.is_winner = is_Winner !== undefined ? is_Winner : entity.is_winner;
    entity.game = game ? await Game.findOneByOrFail({ id: game }) : entity.game;
    entity.user_deck = user_deck ? await User_deck.findOneByOrFail({ id: user_deck }) : entity.user_deck;
    await entity.save();
    return new HttpResponseOK(entity);
  }

  @Delete('/:id')
  async delete(ctx: Context) {
    const entity = await Participation.findOneBy({ id: ctx.request.params.id });
    if (!entity) return new HttpResponseNoContent();
    await entity.remove();
    return new HttpResponseNoContent();
  }

  @Get('/game/:gameId')
  async findByGame(ctx: Context) {
    try {
      const gameId = parseInt(ctx.request.params.gameId);
      const participations = await Participation.find({
        relations: ['game','user_deck','user_deck.user', 'user_deck.deck'],
        where: { game: { id: gameId } }
      });
      return new HttpResponseOK(participations);
    } catch (error) {
      console.log(error);
      return new HttpResponseBadRequest(error);
    }
  }

  @Get('/user/:userId')
  async findByUser(ctx: Context) {
    try {
      const userId = parseInt(ctx.request.params.userId);
      const participations = await Participation.find({
        relations: ['user_deck', 'user_deck.user', 'user_deck.deck', 'game'],
        where: { user_deck: { user: { id: userId } } }
      });
      return new HttpResponseOK(participations);
    } catch (error) {
      console.log(error);
      return new HttpResponseBadRequest(error);
    }
  }

  @Get('/deck/:deckId')
  async findByDeck(ctx: Context) {
    try {
      const deckId = parseInt(ctx.request.params.deckId);
      const participations = await Participation.find({
        relations: ['user_deck', 'user_deck.user', 'user_deck.deck', 'game'],
        where: { user_deck: { deck: { id: deckId } } }
      });
      return new HttpResponseOK(participations);
    } catch (error) {
      console.log(error);
      return new HttpResponseBadRequest(error);
    }
  }

  @Put('/:id/winner')
  async setWinner(ctx: Context) {
    try {
      const participationId = parseInt(ctx.request.params.id);
      const participation = await Participation.findOne({
        relations: ['game'],
        where: { id: participationId }
      });
      
      if (!participation) {
        return new HttpResponseNoContent();
      }
      
      // Erst alle Teilnehmer des Spiels als Verlierer setzen
      await Participation.createQueryBuilder()
        .update(Participation)
        .set({ is_winner: false })
        .where('game = :gameId', { gameId: participation.game.id })
        .execute();
      
      // Dann diesen Teilnehmer als Gewinner setzen
      participation.is_winner = true;
      await participation.save();
      
      return new HttpResponseOK(participation);
    } catch (error) {
      console.log(error);
      return new HttpResponseBadRequest(error);
    }
  }
  
  @Post('/bulk')
  @ValidateBody({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        user: { type: 'number' },
        deck: { type: 'number' },
        game: { type: 'number' },
        is_winner: { type: 'boolean' }
      },
      required: ['user', 'deck', 'game'],
      additionalProperties: false
    }
  })
  async postBulk(ctx: Context) {
    const participations = ctx.request.body;
    if (!Array.isArray(participations) || participations.length === 0) {
      return new HttpResponseBadRequest('Array mit Teilnahmen erwartet.');
    }
    const created: Participation[] = [];
    for (const item of participations) {
      try {
        const user_deck = await check(item.user, item.deck);
        const gameExist = await Game.findOneByOrFail({ id: item.game });
        const participation = new Participation();
        participation.user_deck = user_deck;
        participation.game = gameExist;
        participation.is_winner = item.is_winner || false;
        await participation.save();
        created.push(participation);
      } catch (error) {
        // Fehler für einzelne Einträge ignorieren, aber loggen
        console.log('Fehler bei Bulk-Teilnahme:', error);
      }
    }
    return new HttpResponseCreated(created);
  }
}
