import {
  FilterEventsRepository,
  FilterEventsOut,
} from '../../../../../../../components'
import { MongodbManager } from '../../../../../../../frameworks/db/mongoose/mongodb-manager.def'
import { createFilterEventsQuery, makeFilterEventsPipeline } from '.'

export const makeFilterEventsRepository = (
  mongodbManager: MongodbManager,
): FilterEventsRepository => {
  const filterEvents = async (
    ids?: string[],
    isTentpole?: boolean, // tslint:disable-line bool-param-default
    parentEventId?: string,
    limit: number = 10,
    skip: number = 0,
  ): Promise<FilterEventsOut> => {
    const query = createFilterEventsQuery(ids, isTentpole, parentEventId)
    const pipeline = makeFilterEventsPipeline(query, skip, limit)
    return mongodbManager.eventModel
      .aggregate([
        pipeline.filter,
        pipeline.sortByUpdatedAt,
        pipeline.skip,
        pipeline.limit,
        pipeline.setId,
        pipeline.removeExtraneousFileds,
      ])
      .exec()
  }

  return Object.freeze({
    filterEvents,
  })
}
