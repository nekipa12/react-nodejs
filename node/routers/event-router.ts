import { Router } from '../../../../frameworks/api/core/routers'
import { makeEventExecutor, makeGetEventMetricsExecutor, makeGetEventSummaryValidator } from '../../../../frameworks/api/components'
import { EventBus } from '../../../../core/events'
import { EventDTO, GetEventMetricsRepository, FilterEventsRepository, GetSubEventsRepository, UserDTO } from '../../../../components'
import { RestRepository, ValidatorService, AuthenticationObject } from '../../../../core/definitions'
import { HttpRequest } from '../../core/http'
import { AuthorizationService, AuthenticationService } from '../../../../core/services'
import { makeFilterEventsExecutor, makeFilterEventsValidator } from '../../components/event/filter-events'
import { makeGetSubEventsExecutor, makeGetSubEventsValidator } from '../../components/event/get-sub-events'
import { makeSendContactExecutor, makeSendContactValidator } from '../../components/event/send-contact'

export const configureEventRouter = (
  router: Router,
  eventBus: EventBus,
  validatorService: ValidatorService,
  eventRestRepository: RestRepository<EventDTO>,
  getEventSummaryRepository: GetEventMetricsRepository,
  getSubEventsRepository: GetSubEventsRepository,
  makeAuthorizationService: (req: HttpRequest) => AuthorizationService<UserDTO>,
  makeAuthenticationService: (req: HttpRequest) => AuthenticationService<AuthenticationObject>,
  filterEventsRepository: FilterEventsRepository,
) => {
  const eventExecutor = makeEventExecutor(
    eventBus,
    eventRestRepository,
    makeAuthorizationService,
    validatorService,
    makeAuthenticationService,
  )
  const getEventMetricsExecutor = makeGetEventMetricsExecutor(
    eventBus,
    getEventSummaryRepository,
    makeGetEventSummaryValidator(validatorService),
    makeAuthenticationService,
  )
  const filterEventsExecutor = makeFilterEventsExecutor(
    eventBus,
    filterEventsRepository,
    makeFilterEventsValidator(validatorService),
    makeAuthenticationService,
    makeAuthorizationService,
  )
  const getSubEventsExecutor = makeGetSubEventsExecutor(
    eventBus,
    getSubEventsRepository,
    makeGetSubEventsValidator(validatorService),
    makeAuthenticationService,
  )
  const sendContactExecutor = makeSendContactExecutor(
    eventBus,
    makeSendContactValidator(validatorService),
    makeAuthenticationService,
  )

  return router
    .delete('/:id', eventExecutor.makeDeleteCallback())
    .get('/:id', eventExecutor.makeGetByIdCallback())
    .patch('/:id', eventExecutor.makeUpdateCallback())
    .post('/get-event-metrics', getEventMetricsExecutor)
    .post('/get-sub-events', getSubEventsExecutor)
    .post('/send-contact', sendContactExecutor)
    .post('/filter', filterEventsExecutor)
    .post('/list', eventExecutor.makeGetListCallback())
    .post('/', eventExecutor.makeCreateCallback())
    .put('/:id', eventExecutor.makeReplaceCallback())
}
