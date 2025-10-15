import { Context, Get, Post, Put, Delete, HttpResponseOK, HttpResponseNoContent, HttpResponseCreated, HttpResponseBadRequest, ValidateBody } from '@foal/core';
import { Rating } from '../entities/rating_participation.entity';
import { Participation } from '../entities/participation.entity';
import { User } from '../entities/user.entity';

export class RatingController {
	@Get('/')
	async findAll() {
		const items = await Rating.find();
		return new HttpResponseOK(items);
	}

	@Get('/:id')
	async findById(ctx: Context) {
		const item = await Rating.findOneBy({ id: ctx.request.params.id });
		if (!item) return new HttpResponseNoContent();
		return new HttpResponseOK(item);
	}

	@Post('/')
	@ValidateBody({
		type: 'object',
		properties: {
			participation: { type: 'number' },
			rater: { type: 'number' },
			value: { type: 'integer', minimum: 1, maximum: 10 }
		},
		required: ['participation', 'rater', 'value'],
		additionalProperties: false
	})
	async create(ctx: Context) {
		try {
      // Prüfen ob bereits eine Bewertung existiert
      const existingRating = await Rating.findOne({
        where: {
          participation: { id: ctx.request.body.participation },
          rater: { id: ctx.request.body.rater }
        }
      });
      if (existingRating) return new HttpResponseBadRequest('User has already rated this participation.');

			const rating = new Rating();
			rating.participation = await Participation.findOneByOrFail({ id: ctx.request.body.participation });
			rating.rater = await User.findOneByOrFail({ id: ctx.request.body.rater });
			rating.value = ctx.request.body.value;
			await rating.save();
			return new HttpResponseCreated(rating);
		} catch (error) {
			console.log(error);
			return new HttpResponseBadRequest(error);
		}
	}

	@Put('/:id')
	@ValidateBody({
		type: 'object',
		properties: {
			value: { type: 'integer', minimum: 1, maximum: 10 },
			rater: { type: 'number' },
			participation: { type: 'number' }
		},
		required: [],
		additionalProperties: false
	})
	async update(ctx: Context) {
		try {
			const entity = await Rating.findOneBy({ id: ctx.request.params.id });
			if (!entity) return new HttpResponseNoContent();

			const { participation, rater, value } = ctx.request.body;

			// Wenn sich rater oder participation ändert, prüfe auf Duplikate
			if (rater !== undefined || participation !== undefined) {
				const newRaterId = rater !== undefined ? rater : entity.rater.id;
				const newParticipationId = participation !== undefined ? participation : entity.participation.id;

				// Prüfe ob bereits eine andere Bewertung existiert
				const existingRating = await Rating.findOne({
					where: {
						participation: { id: newParticipationId },
						rater: { id: newRaterId }
					}
				});

				if (existingRating && existingRating.id !== entity.id) {
					return new HttpResponseBadRequest('User has already rated this participation.');
				}
			}

			// Aktualisiere die Werte
			entity.value = value !== undefined ? value : entity.value;
			if (rater !== undefined) {
				entity.rater = await User.findOneByOrFail({ id: rater });
			}
			if (participation !== undefined) {
				entity.participation = await Participation.findOneByOrFail({ id: participation });
			}

			await entity.save();
			return new HttpResponseOK(entity);
		} catch (error) {
			console.log(error);
			return new HttpResponseBadRequest(error);
		}
	}

	@Delete('/:id')
	async delete(ctx: Context) {
		const entity = await Rating.findOneBy({ id: ctx.request.params.id });
		if (!entity) return new HttpResponseNoContent();
		await entity.remove();
		return new HttpResponseNoContent();
	}

	// Bewertungen für eine bestimmte Teilnahme abrufen
	@Get('/participation/:participationId')
	async getByParticipation(ctx: Context) {
		try {
			const participationId = parseInt(ctx.request.params.participationId);
			const ratings = await Rating.find({
				where: { participation: { id: participationId } },
				relations: ['rater', 'participation', 'participation.user_deck', 'participation.user_deck.user', 'participation.user_deck.deck']
			});
			return new HttpResponseOK(ratings);
		} catch (error) {
			console.error('Error fetching ratings by participation:', error);
			return new HttpResponseBadRequest(error);
		}
	}

	// Bewertungen von einem bestimmten Benutzer abrufen
	@Get('/rater/:raterId')
	async getByRater(ctx: Context) {
		try {
			const raterId = parseInt(ctx.request.params.raterId);
			const ratings = await Rating.find({
				where: { rater: { id: raterId } },
				relations: ['rater', 'participation', 'participation.user_deck', 'participation.user_deck.user', 'participation.user_deck.deck']
			});
			return new HttpResponseOK(ratings);
		} catch (error) {
			console.error('Error fetching ratings by rater:', error);
			return new HttpResponseBadRequest(error);
		}
	}
}
