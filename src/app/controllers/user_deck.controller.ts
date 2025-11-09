import { Context, Delete, Get, HttpResponseBadRequest, HttpResponseCreated, HttpResponseNoContent, HttpResponseNotFound, HttpResponseOK, Post, ValidateBody, ValidatePathParam } from '@foal/core';
import { JWTRequired } from '@foal/jwt';
import { Deck, User, User_deck } from '../entities/index';

export class User_deckController {

  @Get('/')
  @JWTRequired()
  async getUser_Decks() {
    const user_deck = await User_deck.find({ relations: ['user', 'deck', 'participations'] });
    return new HttpResponseOK(user_deck);
  }

  @Post('/')
  @JWTRequired()
  @ValidateBody({
    type: 'object',
    properties: {
      user: { type: 'number' },
      deck: { type: 'number' }
    },
    required: ['user', 'deck'],
    additionalProperties: false,
  })
  async postUser_deck(ctx: Context) {
    try {
      const check = await User_deck.findOneBy({ user: ctx.request.body.user, deck: ctx.request.body.deck });

      if(check != null) return new HttpResponseBadRequest('User_deck already exists');

      const user = await User.findOneByOrFail({ id: ctx.request.body.user });
      const deck = await Deck.findOneByOrFail({ id: ctx.request.body.deck });

      const user_deck = new User_deck();
      user_deck.user = user;
      user_deck.deck = deck;

      await user_deck.save();

      return new HttpResponseCreated(user_deck);

    } catch (error) {
      return new HttpResponseBadRequest(error);
    }
  }

  @Delete('/:id')
  @JWTRequired()
  @ValidatePathParam('id', { type: 'number' })
  async deleteUser_Deck(ctx: Context) {
    const user_deck = await User_deck.findOneBy({ id: ctx.request.params.id })
    if (!user_deck) return new HttpResponseNotFound();

    await user_deck.remove();

    return new HttpResponseNoContent();
  }

  @Get('/:id')
  @JWTRequired()
  @ValidatePathParam('id', { type: 'number' })
  async getUser_Deck(ctx: Context) {
    const user_deck = await User_deck.findOne({ where: { id: ctx.request.params.id }, relations: ['user', 'deck', 'participations'] });
    if (!user_deck) return new HttpResponseNotFound();
    return new HttpResponseOK(user_deck);
  }

  @Get('/:id/participations')
  @JWTRequired()
  @ValidatePathParam('id', { type: 'number' })
  async getParticipationsForUserDeck(ctx: Context) {
    const userDeck = await User_deck.findOne({ where: { id: ctx.request.params.id }, relations: ['participations'] });
    if (!userDeck) return new HttpResponseNotFound();
    return new HttpResponseOK(userDeck.participations);
  }

}