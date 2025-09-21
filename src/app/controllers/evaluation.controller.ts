import { Context, Get, HttpResponseOK, Post, Put, Delete, HttpResponseCreated, ValidateBody, HttpResponseBadRequest, HttpResponseNoContent } from '@foal/core';
import { DeckEvaluation } from '../entities';

export class EvaluationController {

  @Get('/')
  async getEval() {
    const evaluations = await DeckEvaluation.find();
    if (!evaluations) return new HttpResponseOK([]);
    return new HttpResponseOK(evaluations);
  }

  @Get('/:id')
  async getEvaluationById(ctx: Context) {
    const evaluation = await DeckEvaluation.findOneBy({ id: ctx.request.params.id });
    if (!evaluation) return new HttpResponseNoContent();
    return new HttpResponseOK(evaluation);
  }

  @Post('/')
  @ValidateBody({
    type: 'object',
    properties: {
      deck: { type: 'number' },
      rater: { type: 'number' },
      value: { type: 'number', minimum: 1, maximum: 10 }
    },
    required: ['deck', 'rater', 'value'],
    additionalProperties: false,
  })
  async createEvaluation(ctx: Context) {
    try {
      const exists = await DeckEvaluation.findOne({
        where: {
          deck: { id: ctx.request.body.deck },
          rater: { id: ctx.request.body.rater }
        }
      });
      if (exists) return new HttpResponseBadRequest('User has already rated this deck.');

      const evaluation = new DeckEvaluation();
      evaluation.deck = ctx.request.body.deck;
      evaluation.rater = ctx.request.body.rater;
      evaluation.value = ctx.request.body.value;
      await evaluation.save();
      return new HttpResponseCreated(evaluation);
    } catch (error) {
      return new HttpResponseBadRequest(error);
    }
  }

  @Put('/:id')
  @ValidateBody({
    type: 'object',
    properties: {
      value: { type: 'number', minimum: 1, maximum: 10 }
    },
    required: ['value'],
    additionalProperties: false,
  })
  async updateEvaluation(ctx: Context) {
    try {
      const evaluation = await DeckEvaluation.findOneBy({ id: ctx.request.params.id });
      if (!evaluation) return new HttpResponseNoContent();
      evaluation.value = ctx.request.body.value;
      await evaluation.save();
      return new HttpResponseOK(evaluation);
    } catch (error) {
      return new HttpResponseBadRequest(error);
    }
  }

  @Delete('/:id')
  async deleteEvaluation(ctx: Context) {
    const evaluation = await DeckEvaluation.findOneBy({ id: ctx.request.params.id });
    if (!evaluation) return new HttpResponseNoContent();
    await evaluation.remove();
    return new HttpResponseNoContent();
  }

  @Get('/deck/:deckId')
  async getEvaluationsForDeck(ctx: Context) {
    const evaluations = await DeckEvaluation.find({ where: { deck: { id: ctx.request.params.deckId } } });
    return new HttpResponseOK(evaluations);
  }

  @Get('/user/:userId')
  async getEvaluationsByUser(ctx: Context) {
    const evaluations = await DeckEvaluation.find({ where: { rater: { id: ctx.request.params.userId } } });
    return new HttpResponseOK(evaluations);
  }

  

}
