import { Context, Delete, Get, HttpResponseBadRequest, HttpResponseCreated, HttpResponseNoContent, HttpResponseNotFound, HttpResponseOK, Post, ValidateBody } from '@foal/core';
import { Deck , Game, User, User_deck, } from '../entities/index';


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

export class GameController {

  

  @Get('/')
  async getGames() {
    const games = await Game.find({ relations: ['user_deck1', 'user_deck2', 'user_deck3', 'user_deck4', 'winner'] });
    if (!games) return new HttpResponseNotFound();
    return new HttpResponseOK(games);
  }

  @Post('/')
  @ValidateBody({
    type: 'object',
    properties: {
      user1: { type: 'number' },
      deck1: { type: 'number' },
      user2: { type: 'number' },
      deck2: { type: 'number' },
      user3: { type: ['number', 'null'] },
      deck3: { type: ['number', 'null'] },
      user4: { type: ['number', 'null'] },
      deck4: { type: ['number', 'null'] }
    },
    required: ['user1', 'deck1', 'user2', 'deck2'],
    additionalProperties: false,
  })
  async postGame(ctx: Context) {
    try {
      const game = new Game();
      const userDecks = [
        { user: ctx.request.body.user1, deck: ctx.request.body.deck1 },
        { user: ctx.request.body.user2, deck: ctx.request.body.deck2 },
        { user: ctx.request.body.user3, deck: ctx.request.body.deck3 },
        { user: ctx.request.body.user4, deck: ctx.request.body.deck4 }
      ];

      const users = userDecks.map(ud => ud.user).filter(user => user !== null && user !== undefined);

      const uniqueUsers = new Set(users);
      if (uniqueUsers.size !== users.length) {
        return new HttpResponseBadRequest('Duplicate users are not allowed.');
      }

      for (let i = 0; i < userDecks.length; i++) {
        if (userDecks[i].user !== null && userDecks[i].deck !== null) {
          (game as any)[`user_deck${i + 1}`] = await check(userDecks[i].user, userDecks[i].deck);
        }
      }

      await game.save();
      return new HttpResponseCreated(game);
    } catch (error) {
      console.log(error);
      return new HttpResponseBadRequest(error);
    }
  }
  
  



  @Delete('/:id')
  async deleteGame(ctx: Context) {
    const game = await Game.findOneBy({ id: ctx.request.params.id });
    if (!game) return new HttpResponseNotFound();

    await game.remove();

    return new HttpResponseNoContent();
  }

  @Get('/:id')
  async getGame(ctx: Context) {
    const game = await Game.find({ where: { id: ctx.request.params.id }, relations: ['user1', 'deck1', 'user2', 'deck2', 'user3', 'deck3', 'user4', 'deck4', 'winnerUser', 'winnerDeck'] });
    if (!game) return new HttpResponseNotFound();

    return new HttpResponseOK(game);
  }

  /*
  @Put('/:id')
  @ValidateBody({
    type: 'object',
    properties: {
      user1: { type: 'number', nullable: true },
      deck1: { type: 'number', nullable: true },
      user2: { type: 'number', nullable: true },
      deck2: { type: 'number', nullable: true },
      user3: { type: 'number', nullable: true },
      deck3: { type: 'number', nullable: true },
      user4: { type: 'number', nullable: true },
      deck4: { type: 'number', nullable: true },
      winnerUser: { type: 'number', nullable: true },
      winnerDeck: { type: 'number', nullable: true }
    },
    required: [],
    additionalProperties: false,
  })
  async updateGame(ctx: Context) {
    try {
      const game = await Game.findOneOrFail({ where: { id: ctx.request.params.id }, relations: ['user1', 'deck1', 'user2', 'deck2', 'user3', 'deck3', 'user4', 'deck4', 'winnerUser', 'winnerDeck'] });
  
      if (ctx.request.body.user1) {
        const user1 = await User.findOneByOrFail({ id: ctx.request.body.user1 });
        game.user1 = user1;
      }
  
      if (ctx.request.body.deck1) {
        const deck1 = await Deck.findOneByOrFail({ id: ctx.request.body.deck1 });
        game.deck1 = deck1;
      }
  
      if (ctx.request.body.user2) {
        const user2 = await User.findOneByOrFail({ id: ctx.request.body.user2 });
        game.user2 = user2;
      }
  
      if (ctx.request.body.deck2) {
        const deck2 = await Deck.findOneByOrFail({ id: ctx.request.body.deck2 });
        game.deck2 = deck2;
      }
  
      if (ctx.request.body.user3) {
        const user3 = await User.findOneByOrFail({ id: ctx.request.body.user3 });
        game.user3 = user3;
      }
  
      if (ctx.request.body.deck3) {
        const deck3 = await Deck.findOneByOrFail({ id: ctx.request.body.deck3 });
        game.deck3 = deck3;
      }
  
      if (ctx.request.body.user4) {
        const user4 = await User.findOneByOrFail({ id: ctx.request.body.user4 });
        game.user4 = user4;
      }
  
      if (ctx.request.body.deck4) {
        const deck4 = await Deck.findOneByOrFail({ id: ctx.request.body.deck4 });
        game.deck4 = deck4;
      }
  
      if (ctx.request.body.winnerUser) {
        const winnerUser = await User.findOneByOrFail({ id: ctx.request.body.winnerUser });
        game.winnerUser = winnerUser;
      }
  
      if (ctx.request.body.winnerDeck) {
        const winnerDeck = await Deck.findOneByOrFail({ id: ctx.request.body.winnerDeck });
        game.winnerDeck = winnerDeck;
      }
  
      await game.save();
  
      return new HttpResponseOK(game);
    } catch (error) {
      return new HttpResponseBadRequest(error);
    }
  }

  @Get('/winner/:winnerUserId')
  async getGamesByWinner(ctx: Context) {
    const games = await Game.find({ where: { winnerUser: { id: ctx.request.params.winnerUserId } }, relations: ['winnerUser', 'winnerDeck'] });
    return new HttpResponseOK(games);
  }
*/
}