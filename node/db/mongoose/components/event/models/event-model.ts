import { EventDTO } from '../../../../../../components'
import mongoose, { Schema, Document } from 'mongoose'

export interface EventModel extends Document, Omit<EventDTO , 'id'> {}

const schema = new Schema<EventModel>({
  createdAt: { type: Number, required: true },
  defaultNominationStatus: { type: String, required: true },
  eventDate: { type: Number, required: true },
  eventDescription: { type: String, required: true },
  eventHeader: { type: String, required: true },
  eventLogo: { type: String, required: true },
  eventName: { type: String, required: true },
  eventNameShort: { type: String, required: true },
  eventObjectives: { type: [String], required: true },
  eventResources: { type: [String], required: true },
  eventType: { type: String, required: true },
  isTentpole: { type: Boolean, required: true },
  nominationDeadline: { type: Number, required: true },
  targetClient: { type: String, required: true },
  totalEventSeatCount: { type: Number, required: true },
  updatedAt: { type: Number, required: true },
  url: { type: String, required: true },
})

export const makeEventModel = (
  conn: mongoose.Connection,
) => conn.model<EventModel>('Event', schema)
