import mongoose from 'mongoose'

interface Query {
  _id?: { $in: mongoose.Types.ObjectId[] }
  isTentpole?: boolean
  parentEventId?: string
}

export const createFilterEventsQuery = (
  ids?: string[],
  isTentpole?: boolean, // tslint:disable-line bool-param-default
  parentEventId?: string,
) => {
  const query = {
    _id: typeof ids === 'undefined'
      ? undefined
      : { $in: ids.map((id) => mongoose.Types.ObjectId(id)) },
    isTentpole,
    parentEventId,
  }
  if (typeof query._id === 'undefined') {
    delete query._id
  }
  if (typeof query.isTentpole === 'undefined') {
    delete query.isTentpole
  }
  if (typeof query.parentEventId === 'undefined') {
    delete query.parentEventId
  }
  return query
}

const makeFilter = (query: Query) => ({ $match: query })

const sortByUpdatedAt = { $sort: { updatedAt: 1 } }

const setId = {
  $set: {
    id: '$_id',
  },
}

const skipStage = (skip: number) => ({
  $skip: skip,
})

const limitStage = (limit: number) => ({
  $limit: limit,
})

const removeExtraneousFileds = {
  $unset: [
    '_id',
    '__v',
  ],
}

// tslint:disable object-literal-sort-keys
export const makeFilterEventsPipeline = (
  query: Query,
  skip: number,
  limit: number,
) => ({
  filter: makeFilter(query),
  sortByUpdatedAt,
  skip: skipStage(skip),
  limit: limitStage(limit),
  setId,
  removeExtraneousFileds,
})
// tslint:enable object-literal-sort-keys
