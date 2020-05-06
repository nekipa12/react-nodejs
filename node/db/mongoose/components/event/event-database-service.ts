import mongoose from 'mongoose'
import { DatabaseService } from '../../../../../core/services'
import { makeRestDatabaseService } from '../../services'
import { EventDTO } from '../../../../../components'
import { TimeHelper } from '../../../../../core/utils'
import { EventModel } from '../../components'

export const makeEventDatabaseService = (
  model: mongoose.Model<EventModel, {}>,
  timeHelper: TimeHelper,
): DatabaseService<EventDTO> => {
  return makeRestDatabaseService(model, timeHelper)
}
