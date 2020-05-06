import {
  GetSubEventsRepository,
  EventDTO,
} from '../../../../../../../components'
import { MongodbManager } from '../../../../mongodb-manager.def'

export const makeGetSubEventsRepository = (
  mongodbManager: MongodbManager,
): GetSubEventsRepository => {

  const getEventDTO = async (eventId: string): Promise<EventDTO> => {
    return mongodbManager.eventDatabaseService.getById(eventId)
  }

  const getSubEvents = async (eventId: string): Promise<EventDTO[]> => {
    return mongodbManager.eventModel
      .aggregate([
        { $match: { parentEventId: eventId } },
        { $sort: { eventName: 1 } },
        { $set: { id: { $toString: '$_id' } } },
        { $unset: [ '_id', '__v' ] },
      ])
      .exec()
  }

  return Object.freeze({
    getEventDTO,
    getSubEvents,
  })
}
