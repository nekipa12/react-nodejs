import {
  GetEventMetricsRepository,
  NominationAppStatus,
  QueryResultActiveEventNomination,
  QueryResultSegmentSeatAllocation,
  EventDTO,
  CountryCode,
} from '../../../../../../../components'
import { MongodbManager } from '../../../../mongodb-manager.def'

export const makeGetEventMetricsRepository = (
  mongodbManager: MongodbManager,
): GetEventMetricsRepository => {

  const getEventDTO = async (eventId: string): Promise<EventDTO> => {
    return mongodbManager.eventDatabaseService.getById(eventId)
  }

  const getActiveEventNominations = async (eventId: string): Promise<QueryResultActiveEventNomination[]> => {
    return mongodbManager.nominationModel
      .aggregate([
        { $match:
          {
            appStatus: { $in: [
              NominationAppStatus.APP_APPROVED,
              NominationAppStatus.APP_EXPORTED,
            ]},
            eventId,
          },
        },
        { $project:
          {
            appStatus: 1,
            bookOfBusiness: 1,
            djStatus: 1,
            id: { $toString: '$_id' },
            nominatorId: 1,
            platform: 1,
            segmentName: 1,
            teamId: 1,
          },
        },
      ])
  }

  const getEventSegmentSeatAllocations = async (eventId: string): Promise<QueryResultSegmentSeatAllocation[]> => {
    return mongodbManager.segmentSeatAllocationModel
      .aggregate([
        { $match:
          {
            eventId,
          },
        },
        {
          $project:
          {
            id: { $toString: '$_id' },
            rsvpTarget: 1,
            seatAllocationCount: 1,
            segmentName: 1,
          },
        },
      ])
  }

  const getCountryCodeSegmentName = async (countryCode: CountryCode): Promise<string | null> => {
    const model = await mongodbManager.bookOfBusinessModel.findOne({
      countryCode,
      teamId: null,
    }).exec()
    if (model === null) {
      return null
    }
    return model.countryCodeSegmentName
  }

  const getTeamSegmentName = async (eventDTO: EventDTO, teamId: string): Promise<string | null> => {
    const model = await mongodbManager.bookOfBusinessModel.findOne({
      teamId,
    }).exec()
    if (model === null) {
      return null
    }
    if (eventDTO.eventNameShort.toUpperCase() === 'GML') {
      return model.gmlSegmentName
    }
    if (eventDTO.eventNameShort.toUpperCase() === 'BC') {
      return model.bcSegmentName
    }
    // TODO: subeventss
    return null
  }

  const hasTeamSeatAllocationRecord = async (eventId: string): Promise<boolean> => {
    const model = await mongodbManager.seatAllocationModel.findOne({ eventId }).exec()
    return model !== null
  }

  return Object.freeze({
    getActiveEventNominations,
    getCountryCodeSegmentName,
    getEventDTO,
    getEventSegmentSeatAllocations,
    getTeamSegmentName,
    hasTeamSeatAllocationRecord,
  })
}
