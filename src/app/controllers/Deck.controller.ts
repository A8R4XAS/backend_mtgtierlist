import { Context, Delete, Get, HttpResponseBadRequest, HttpResponseCreated, HttpResponseNoContent, HttpResponseNotFound, HttpResponseOK, Post, Put, ValidateBody, ValidatePathParam } from '@foal/core';
import { Deck, User } from '../entities/index';

export class DeckController {

  @Get('/')
  async getDecks() {
    const decks = await Deck.find({ relations: ['owner'] });
    if (!decks) return new HttpResponseNotFound();
    return new HttpResponseOK(decks);
  }

  // Neuer Endpunkt: POST / - Deck erstellen mit User-ID aus Body
  @Post('/')
  @ValidateBody({
    type: 'object',
    properties: {
      commander: { type: 'string', maxLength: 255 },
      userId: { type: 'number' }
    },
    required: ['commander', 'userId'],
    additionalProperties: true,
  })
  async createDeck(ctx: Context) {
    try {
      const user = await User.findOneByOrFail({
        id: ctx.request.body.userId
      });

      const deck      = new Deck();
      deck.owner      = user;
      deck.commander  = ctx.request.body.commander;
      deck.thema      = ctx.request.body.thema;
      deck.gameplan   = ctx.request.body.gameplan;
      deck.tempo      = ctx.request.body.tempo;
      deck.tier       = ctx.request.body.tier;
      deck.weaknesses = ctx.request.body.weaknesses;

      await deck.save();

      return new HttpResponseCreated(deck);
    } catch (error) {
      return new HttpResponseBadRequest(error);
    }
  }

  // Legacy Endpunkt: POST /:id - Deck erstellen mit User-ID aus URL
  @Post('/:id')
  @ValidatePathParam('id', { type: 'number' })
  @ValidateBody({
    type: 'object',
    properties: {
      commander: { type: 'string', maxLength: 255 }
    },
    required: ['commander'],
    additionalProperties: true,
  })
  async postDeck(ctx: Context) {
    try {

      const user = await User.findOneByOrFail({
        id: ctx.request.params.id
      });

      const deck      = new Deck();
      deck.owner      = user;
      deck.commander  = ctx.request.body.commander;
      deck.thema      = ctx.request.body.thema;
      deck.gameplan   = ctx.request.body.gameplan;
      deck.tempo      = ctx.request.body.tempo;
      deck.tier       = ctx.request.body.tier;
      deck.weaknesses = ctx.request.body.weaknesses;

      await deck.save();

      return new HttpResponseCreated(deck);
    } catch (error) {
      return new HttpResponseBadRequest(error);
    }
  }




  @Delete('/:id')
  @ValidatePathParam('id', { type: 'number' })
  async deleteDeck(ctx: Context) {
    const deck = await Deck.findOneBy({ id: ctx.request.params.id });
    if (!deck) return new HttpResponseNotFound();

    await deck.remove();

    return new HttpResponseNoContent();
  }




  @Get('/:id')
  async getDeck(ctx: Context) {
    const deck = await Deck.findOneBy({ id: ctx.request.params.id });
    if (!deck) return new HttpResponseNotFound();

    return new HttpResponseOK(deck);
  }





  @Put('/:id')
  @ValidatePathParam('id', { type: 'number' })
  @ValidateBody({
    type: 'object',
    properties: {
      commander: { type: 'string', maxLength: 255 }
    },
    required: ['commander'],
    additionalProperties: true,
  })
  async updateDeck(ctx: Context) {
    try {
      const deck = await Deck.findOneByOrFail({ id: ctx.request.params.id });

      if (ctx.request.body.owner) {
        const user = await User.findOneByOrFail({ id: ctx.request.body.owner });
        deck.owner = user;
      }

      deck.commander  = ctx.request.body.commander  || deck.commander;
      deck.thema      = ctx.request.body.thema      || deck.thema;
      deck.gameplan   = ctx.request.body.gameplan   || deck.gameplan;
      deck.tempo      = ctx.request.body.tempo      || deck.tempo;
      deck.tier       = ctx.request.body.tier       || deck.tier;
      deck.weaknesses = ctx.request.body.weaknesses || deck.weaknesses;

      await deck.save();

      return new HttpResponseOK(deck);
    } catch (error) {
      return new HttpResponseBadRequest(error);
    }
  }




  @Get('/owner/:ownerId')
  async getDecksByOwner(ctx: Context) {
    const decks = await Deck.find({ where: { owner: { id: ctx.request.params.ownerId } }, relations: ['owner'] });
    return new HttpResponseOK(decks);
  }

  

  @Get('/commander/:commander')
  async getDecksByCommander(ctx: Context) {
    const decks = await Deck.find({ where: { commander: ctx.request.params.commander }, relations: ['owner'] });
    return new HttpResponseOK(decks);
  }

}



