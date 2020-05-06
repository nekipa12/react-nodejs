// tslint:disable max-func-body-length max-file-line-count no-big-function no-commented-code
import path from 'path'
import bodyParser from 'body-parser'
import express from 'express'
import { Server } from 'http'
import { configureEventBus } from '../../../events'
import { HttpServer } from '../../../frameworks/api/core/server.def'
import { EventBus } from '../../../core/events'
import { makeTimeHelper } from '../../../frameworks/utils/time/moment'
import { makeRestRepository } from '../../db/mongoose/components/rest'
import { EnvHelper } from '../../../core/utils'
import { HttpService, makeValidatorService, makeAuthorizationService } from '../../../core/services'
import { makeAuthenticationService  } from '../../api/core/services'
import { makeCronAuthenticationService  } from '../../api/core/services/authentication-service/cron-authentication-service'
import { makeWebhookAuthenticationService  } from '../../api/core/services/authentication-service/webhook-authentication-service'
import * as Routers from '../../../frameworks/api/express/routers'
import * as UserRepositories from '../../db/mongoose/components/user/repositories'
import { makeEncryptionHelper } from '../../../frameworks/utils/encryption/bcrypt'
import { makeJwtHelper } from '../../../frameworks/utils/jwt/jsonwebtoken'
import {
  makeSendNominationRequestRepository,
  makeGetNominationsRepository,
  makeCancelNominationRepository,
  makeRejectNominationRepository,
  makeApproveNominationRepository,
  makeGetNominationsForApprovalRepository,
  makeGetExpandedNominationByIdRepository,
  makeUpdateNominationRepository,
  makeSubscribeToNominationRepository,
  makeGetSubscribersRepository,
  makeExportNominationsRepository,
  makeExportNominationsForApprovalRepository,
} from '../../db/mongoose/components/nomination/repositories'
import { makeGetEventMetricsRepository, makeFilterEventsRepository, makeGetSubEventsRepository } from '../../db/mongoose/components/event/repositories'
import {
  makeGetTeamsForNominationRepository,
  makeGetTeamMetricsByCompanyRepository,
  makeGetTeamSegmentMetricsByCompanyRepository,
} from '../../db/mongoose/components/team/repositories'
import {
  makeSearchNomineeRepository,
  makeSuggestNomineeRepository,
  makeGetNomineeWithRelationsRepository,
} from '../../db/mongoose/components/nominee/repositories'
import {
  makeSearchCompanyRepository,
  makeGetCompaniesForNominationRepository,
} from '../../db/mongoose/components/company/repositories'
import { makeMongodbManager } from '../../../frameworks/db/mongoose/connection'
import { MongodbManager } from '../../../frameworks/db/mongoose/mongodb-manager.def'
// import {
//   makeAuthorizedGoogleApiJwtClient,
//   makeGoogleApiSheet,
//   makeGcpCredentials,
// } from '../../../frameworks/services/google-api'
import { makeImportHelper } from '../../../frameworks/utils/import'
import { makeAuthorizationServiceRepository, makeLogService } from '../../../frameworks/db/mongoose/services'
import {
  makeElectApproverRepository,
  makeAcceptRoleRepository,
  makeRejectRoleRepository,
  makeRemoveRoleRepository,
  makeSearchRoleRepository,
  makeDeleteScheduleRepository,
  makeSetScheduleRepository,
  makeEmailStatusUpdateWebhookRepository,
} from '../../../frameworks/db/mongoose/components'
import {
  makeMarkSeenRepository,
} from '../../db/mongoose/components/alert/repositories'
import {
  makeFindBookOfBusinessRepository,
  makeGetTeamsBySegmentNameRepository,
  makeGetSegmentNameRepository,
  makeGetCompaniesBySegmentNameRepository,
} from '../../db/mongoose/components/book-of-business/repositories'
import { makeEventTypeHelper, EventTypeMap } from '../../../core/utils/event-type'
import { makeToolStatusHelper } from '../../../core/utils/tool-status'
import { makeExportNominationsRepository as makeCronExportNominationRepository } from '../../../frameworks/db/mongoose/components/cron/repositories/export-nominations'
import { makeCronDownloadDefjamStatusesRepository } from '../../../frameworks/db/mongoose/components/cron/repositories/download-defjam-status'
import { makeAuthorizedGoogleApiJwtClient, makeGcpCredentials } from '../../../frameworks/services/google-api'
import { makeCronUpdateNominationDefjamStatusRepository } from '../../../frameworks/db/mongoose/components/cron/repositories/update-nomination-defjam-status'
import { makeNominationExportHelper, NominationExportMap } from '../../../core/utils/nomination-export'
import { makeCronExceptionSummaryRepository } from '../../../frameworks/db/mongoose/components/cron/repositories/email-notification/exception-summary'
import { makeEmailServiceFactory } from '../../../frameworks/utils/email-service-factory/email-service-factory'
import { makeGetEmailNotificationDetailsRepository } from '../../../frameworks/db/mongoose/components/notifications/repositories/get-email-notification-details'
import { makeEventHelper } from '../../../core/utils/event/event-helper'
import { makeCronNdaAndExceptionSummaryRepository } from '../../../frameworks/db/mongoose/components/cron/repositories/email-notification/nda-and-exception-summary'
import { makeCronClosingRepository } from '../../../frameworks/db/mongoose/components/cron/repositories/email-notification/closing'
import { makeGetSegmentNamesRepository } from '../../db/mongoose/components/book-of-business/repositories/get-segment-names'
import { makeCronInviteDeadlineRepository } from '../../../frameworks/db/mongoose/components/cron/repositories/email-notification/invite-deadline'
import { makeCronInviteScheduleRepository } from '../../../frameworks/db/mongoose/components/cron/repositories/email-notification/invite-schedule'
import { makeCronSendEmailRepository } from '../../../frameworks/db/mongoose/components/cron/repositories/email-notification/send-email'
import { makeCronRetryEmailRepository } from '../../../frameworks/db/mongoose/components/cron/repositories/email-notification/retry-email'
import { makeAlertHelper } from '../../../core/utils/alert'
import { makeClosingTypeHelper } from '../../../core/utils/closing-type/closing-type-helper'

export const makeServer = (
  port: number,
  eventBus: EventBus,
  envHelper: EnvHelper,
  frontendBuildDir: string,
  frontendIndexFile: string,
  googleHttpService: HttpService,
  silent: boolean = false,
): HttpServer => {
  const app = express()
  let server: Server
  let mongodbManager: MongodbManager

  const disconnectDatabase = async () => {
    if (typeof mongodbManager !== 'undefined') {
      await mongodbManager.disconnect()
    }
  }

  const start = async () => {
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(frontendBuildDir))
    }

    const timeHelper = makeTimeHelper()
    mongodbManager = await makeMongodbManager(envHelper, timeHelper)
    const alertHelper = makeAlertHelper(timeHelper, mongodbManager)

    const logServices = [makeLogService(mongodbManager.logDatabaseService)]

    configureEventBus(eventBus, logServices, mongodbManager, timeHelper, alertHelper)

    const encryptionHelper = makeEncryptionHelper()
    const jwtHelper = makeJwtHelper()
    const importHelper = makeImportHelper()
    const eventHelper = makeEventHelper(envHelper)
    const eventTypeHelper = makeEventTypeHelper(EventTypeMap)
    const toolStatusHelper = makeToolStatusHelper(eventTypeHelper, timeHelper)
    const nominationExportHelper = makeNominationExportHelper(NominationExportMap)
    const closingTypeHelper = makeClosingTypeHelper()

    const authorizationServiceRepoitory = makeAuthorizationServiceRepository(mongodbManager)
    const authorizationServiceFactory = makeAuthorizationService(jwtHelper, authorizationServiceRepoitory)
    const authenticationServiceFactory = makeAuthenticationService(
      jwtHelper,
    )
    const makeCronAuthenticationServiceFactory = makeCronAuthenticationService()
    const makeWebhookAuthenticationServiceFactory = makeWebhookAuthenticationService(envHelper)
    const validatorServiceFactory = makeValidatorService(timeHelper)

    // const gcpCredentials = makeGcpCredentials(envHelper)
    // const authorizedGoogleApiJwtClient = await makeAuthorizedGoogleApiJwtClient(gcpCredentials)
    // const googleApiSheet = await makeGoogleApiSheet(authorizedGoogleApiJwtClient)

    const exportNominationsJwtClient = await makeAuthorizedGoogleApiJwtClient(
      makeGcpCredentials(envHelper, 'MAIN'),
      ['https://www.googleapis.com/auth/spreadsheets'],
    )

    const downloadDefjamStatusesJwtClients = []
    for (const keyNamePostfix of ['1', '2', '3', '4', '5']) {
      const gcpCredentials = makeGcpCredentials(envHelper, keyNamePostfix)
      downloadDefjamStatusesJwtClients.push(await makeAuthorizedGoogleApiJwtClient(
        gcpCredentials,
        ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      ))
    }

    const emailService = makeEmailServiceFactory(mongodbManager, envHelper, timeHelper).get()

    const alertRouter = express.Router()
    const bookOfBusinessRouter = express.Router()
    const companyRouter = express.Router()
    const cronRouter = express.Router()
    const deadlineRouter = express.Router()
    const eventRouter = express.Router()
    const homeRouter = express.Router()
    const nominationRouter = express.Router()
    const nomineeRouter = express.Router()
    const notificationRouter = express.Router()
    const oauthRouter = express.Router()
    const roleRouter = express.Router()
    const seatAllocationRouter = express.Router()
    const segmentSeatAllocationRouter = express.Router()
    const endCustomerSeatAllocationRouter = express.Router()
    const teamRouter = express.Router()
    const userRouter = express.Router()
    const waveRouter = express.Router()
    // const mongoDbRouter = express.Router()
    const userBcTeamCompanyRouter = express.Router()
    const userGmlTeamCompanyRouter = express.Router()
    const userPlatformCompanyRouter = express.Router()
    const taskQueueRouter = express.Router()
    const webhookRouter = express.Router()

    const sendNominationRequestRepository = makeSendNominationRequestRepository(mongodbManager)
    const getNominationsRepository = makeGetNominationsRepository(
      mongodbManager,
      toolStatusHelper,
      eventTypeHelper,
    )
    const cancelNominationRepository = makeCancelNominationRepository(mongodbManager)
    const getEventMetricsRepository = makeGetEventMetricsRepository(mongodbManager)
    const getTeamsForNominationRepository = makeGetTeamsForNominationRepository(mongodbManager)
    const searchNomineeRepository = makeSearchNomineeRepository(mongodbManager)
    const getNomineeWithRelationsRepository = makeGetNomineeWithRelationsRepository(mongodbManager)
    const filterEventsRepository = makeFilterEventsRepository(mongodbManager)
    const searchCompanyRepository = makeSearchCompanyRepository(mongodbManager)
    const getSubEventsRepository = makeGetSubEventsRepository(mongodbManager)
    const electApproverRepository = makeElectApproverRepository(mongodbManager)
    const acceptRoleRepository = makeAcceptRoleRepository(mongodbManager)
    const rejectRoleRepository = makeRejectRoleRepository(mongodbManager)
    const removeRoleRepository = makeRemoveRoleRepository(mongodbManager)
    const markSeenRepository = makeMarkSeenRepository(mongodbManager)
    const rejectNominationRepository = makeRejectNominationRepository(mongodbManager)
    const approveNominationRepository = makeApproveNominationRepository(mongodbManager)
    const getNominationsForApprovalRepository = makeGetNominationsForApprovalRepository(
      mongodbManager,
      toolStatusHelper,
    )
    const getExpandedNominationByIdRepository = makeGetExpandedNominationByIdRepository(mongodbManager)
    const getTeamSegmentMetricsByCompanyIdRepository = makeGetTeamSegmentMetricsByCompanyRepository(mongodbManager)
    const updateNominationRepository = makeUpdateNominationRepository(mongodbManager)
    const getTeamMetricsByCompanyRepository = makeGetTeamMetricsByCompanyRepository(mongodbManager)
    const subscribeToNominationRepository = makeSubscribeToNominationRepository(mongodbManager)
    const suggestNomineeRepository = makeSuggestNomineeRepository(mongodbManager)
    const getCompaniesForNominationRepository = makeGetCompaniesForNominationRepository(
      mongodbManager,
    )
    const findBookOfBusinessRepository = makeFindBookOfBusinessRepository(mongodbManager)
    const getTeamsBySegmentNameRepository = makeGetTeamsBySegmentNameRepository(mongodbManager)
    const getSegmentNameRepository = makeGetSegmentNameRepository(
      mongodbManager,
      eventTypeHelper,
    )
    const getSegmentNamesRepository = makeGetSegmentNamesRepository(
      mongodbManager,
    )
    const getSubscribersRepository = makeGetSubscribersRepository(mongodbManager)
    const getCompaniesBySegmentNameRepository = makeGetCompaniesBySegmentNameRepository(mongodbManager)
    const exportNominationsRepository = makeExportNominationsRepository(
      mongodbManager,
      toolStatusHelper,
      timeHelper,
      nominationExportHelper,
    )
    const exportNominationsForApprovalRepository = makeExportNominationsForApprovalRepository(mongodbManager)
    const cronExportNominationsRepository = makeCronExportNominationRepository(mongodbManager)
    const cronDownloadDefjamStatusesRepository = makeCronDownloadDefjamStatusesRepository(mongodbManager)
    const cronUpdateNominationDefjamStatusRepository = makeCronUpdateNominationDefjamStatusRepository(mongodbManager)
    const cronExceptionSummaryRepository = makeCronExceptionSummaryRepository(mongodbManager)
    const cronNdaAndExceptionSummaryRepository = makeCronNdaAndExceptionSummaryRepository(mongodbManager)
    const cronClosingRepository = makeCronClosingRepository(mongodbManager)
    const cronInviteDeadlineRepository = makeCronInviteDeadlineRepository(mongodbManager)
    const cronInviteScheduleRepository = makeCronInviteScheduleRepository(mongodbManager)
    const cronSendEmailRepository = makeCronSendEmailRepository(mongodbManager)
    const cronRetryEmailRepository = makeCronRetryEmailRepository(mongodbManager, timeHelper, envHelper)
    const deleteScheduleRepository = makeDeleteScheduleRepository(mongodbManager)
    const setScheduleRepository = makeSetScheduleRepository(mongodbManager)
    const webhookEmailStatusUpdateRepository = makeEmailStatusUpdateWebhookRepository(mongodbManager, timeHelper)
    const searchRoleRepository = makeSearchRoleRepository(mongodbManager)

    Routers.configureAlertRouter(
      Routers.makeRouter(alertRouter),
      eventBus,
      validatorServiceFactory,
      makeRestRepository(mongodbManager.alertDatabaseService),
      markSeenRepository,
      authorizationServiceFactory,
      authenticationServiceFactory,
    )
    Routers.configureBookOfBusinessRouter(
      Routers.makeRouter(bookOfBusinessRouter),
      eventBus,
      validatorServiceFactory,
      makeRestRepository(mongodbManager.bookOfBusinessDatabaseService),
      findBookOfBusinessRepository,
      getSegmentNameRepository,
      getSegmentNamesRepository,
      getTeamsBySegmentNameRepository,
      authorizationServiceFactory,
      authenticationServiceFactory,
      getCompaniesBySegmentNameRepository,
    )
    Routers.configureCompanyRouter(
      Routers.makeRouter(companyRouter),
      eventBus,
      validatorServiceFactory,
      makeRestRepository(mongodbManager.companyDatabaseService),
      searchCompanyRepository,
      authorizationServiceFactory,
      authenticationServiceFactory,
      getCompaniesForNominationRepository,
      eventTypeHelper,
    )
    Routers.configureCronRouter(
      Routers.makeRouter(cronRouter),
      makeCronAuthenticationServiceFactory,
      validatorServiceFactory,
      cronExportNominationsRepository,
      exportNominationsJwtClient,
      cronDownloadDefjamStatusesRepository,
      downloadDefjamStatusesJwtClients,
      cronUpdateNominationDefjamStatusRepository,
      cronExceptionSummaryRepository,
      cronNdaAndExceptionSummaryRepository,
      cronClosingRepository,
      cronInviteDeadlineRepository,
      cronInviteScheduleRepository,
      cronSendEmailRepository,
      cronRetryEmailRepository,
      envHelper,
      importHelper,
      eventBus,
      timeHelper,
      toolStatusHelper,
      emailService,
      alertHelper,
      closingTypeHelper,
    )
    Routers.configureDeadlineRouter(
      Routers.makeRouter(deadlineRouter),
      eventBus,
      validatorServiceFactory,
      makeRestRepository(mongodbManager.deadlineDatabaseService),
      authorizationServiceFactory,
      authenticationServiceFactory,
    )
    Routers.configureEventRouter(
      Routers.makeRouter(eventRouter),
      eventBus,
      validatorServiceFactory,
      makeRestRepository(mongodbManager.eventDatabaseService),
      getEventMetricsRepository,
      getSubEventsRepository,
      authorizationServiceFactory,
      authenticationServiceFactory,
      filterEventsRepository,
    )
    Routers.configureHomeRouter(Routers.makeRouter(homeRouter), eventBus)
    Routers.configureNominationRouter(
      Routers.makeRouter(nominationRouter),
      eventBus,
      validatorServiceFactory,
      makeRestRepository(mongodbManager.nominationDatabaseService),
      authorizationServiceFactory,
      authenticationServiceFactory,
      sendNominationRequestRepository,
      getNominationsRepository,
      cancelNominationRepository,
      rejectNominationRepository,
      approveNominationRepository,
      getNominationsForApprovalRepository,
      getExpandedNominationByIdRepository,
      updateNominationRepository,
      subscribeToNominationRepository,
      getSubscribersRepository,
      exportNominationsRepository,
      exportNominationsForApprovalRepository,
      timeHelper,
    )
    Routers.configureNomineeRouter(
      Routers.makeRouter(nomineeRouter),
      eventBus,
      validatorServiceFactory,
      makeRestRepository(mongodbManager.nomineeDatabaseService),
      searchNomineeRepository,
      getNomineeWithRelationsRepository,
      authorizationServiceFactory,
      authenticationServiceFactory,
      suggestNomineeRepository,
    )
    Routers.configureNotificationRouter(
      Routers.makeRouter(notificationRouter),
      validatorServiceFactory,
      makeGetEmailNotificationDetailsRepository(mongodbManager),
      authorizationServiceFactory,
      authenticationServiceFactory,
      eventHelper,
      timeHelper,
      emailService,
      envHelper,
    )
    Routers.configureOauthRouter(
      Routers.makeRouter(oauthRouter),
      eventBus,
      envHelper,
      googleHttpService,
      jwtHelper,
      UserRepositories.makeHandleGoogleOauthRedirectRepository(mongodbManager),
    )
    Routers.configureRoleRouter(
      Routers.makeRouter(roleRouter),
      eventBus,
      validatorServiceFactory,
      makeRestRepository(mongodbManager.roleDatabaseService),
      electApproverRepository,
      acceptRoleRepository,
      rejectRoleRepository,
      removeRoleRepository,
      authorizationServiceFactory,
      authenticationServiceFactory,
      eventHelper,
      envHelper,
      searchRoleRepository,
    )
    Routers.configureSeatAllocationRouter(
      Routers.makeRouter(seatAllocationRouter),
      eventBus,
      validatorServiceFactory,
      makeRestRepository(mongodbManager.seatAllocationDatabaseService),
      authorizationServiceFactory,
      authenticationServiceFactory,
    )
    Routers.configureSegmentSeatAllocationRouter(
      Routers.makeRouter(segmentSeatAllocationRouter),
      eventBus,
      validatorServiceFactory,
      makeRestRepository(mongodbManager.segmentSeatAllocationDatabaseService),
      authorizationServiceFactory,
      authenticationServiceFactory,
    )
    Routers.configureEndCustomerSeatAllocationRouter(
      Routers.makeRouter(endCustomerSeatAllocationRouter),
      eventBus,
      validatorServiceFactory,
      makeRestRepository(mongodbManager.endCustomerSeatAllocationDatabaseService),
      authorizationServiceFactory,
      authenticationServiceFactory,
    )
    Routers.configureTeamRouter(
      Routers.makeRouter(teamRouter),
      eventBus,
      validatorServiceFactory,
      makeRestRepository(mongodbManager.teamDatabaseService),
      getTeamsForNominationRepository,
      getTeamMetricsByCompanyRepository,
      authorizationServiceFactory,
      authenticationServiceFactory,
      getTeamSegmentMetricsByCompanyIdRepository,
      eventTypeHelper,
    )
    Routers.configureUserRouter(
      Routers.makeRouter(userRouter),
      eventBus,
      validatorServiceFactory,
      makeRestRepository(mongodbManager.userDatabaseService),
      UserRepositories.makeCreateUserRepository(mongodbManager),
      UserRepositories.makeReplaceUserRepository(mongodbManager),
      UserRepositories.makeUpdateUserRepository(mongodbManager),
      UserRepositories.makeGenerateJwtRepository(mongodbManager),
      UserRepositories.makeGetCurrentUserRepository(mongodbManager),
      authorizationServiceFactory,
      encryptionHelper,
      jwtHelper,
      envHelper,
      authenticationServiceFactory,
    )
    // Routers.configureMongoDbRouter(
    //   Routers.makeRouter(mongoDbRouter),
    //   eventBus,
    //   mongodbManager,
    //   envHelper,
    //   googleApiSheet,
    //   importHelper,
    //   timeHelper,
    // )
    Routers.configureUserBcTeamCompanyRouter(
      Routers.makeRouter(userBcTeamCompanyRouter),
      eventBus,
      validatorServiceFactory,
      makeRestRepository(mongodbManager.userBcTeamCompanyDatabaseService),
      authorizationServiceFactory,
      authenticationServiceFactory,
    )
    Routers.configureUserGmlTeamCompanyRouter(
      Routers.makeRouter(userGmlTeamCompanyRouter),
      eventBus,
      validatorServiceFactory,
      makeRestRepository(mongodbManager.userGmlTeamCompanyDatabaseService),
      authorizationServiceFactory,
      authenticationServiceFactory,
    )
    Routers.configureUserPlatformCompanyRouter(
      Routers.makeRouter(userPlatformCompanyRouter),
      eventBus,
      validatorServiceFactory,
      makeRestRepository(mongodbManager.userPlatformCompanyDatabaseService),
      authorizationServiceFactory,
      authenticationServiceFactory,
    )
    Routers.configureTaskQueueRouter(
      Routers.makeRouter(taskQueueRouter),
      eventBus,
      validatorServiceFactory,
      makeRestRepository(mongodbManager.taskQueueDatabaseService),
      authorizationServiceFactory,
      authenticationServiceFactory,
      deleteScheduleRepository,
      setScheduleRepository,
    )
    Routers.configureWaveRouter(
      Routers.makeRouter(waveRouter),
      eventBus,
      validatorServiceFactory,
      makeRestRepository(mongodbManager.waveDatabaseService),
      authorizationServiceFactory,
      authenticationServiceFactory,
    )
    Routers.configureWebhookRouter(
      Routers.makeRouter(webhookRouter),
      eventBus,
      makeWebhookAuthenticationServiceFactory,
      validatorServiceFactory,
      webhookEmailStatusUpdateRepository,
    )

    app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }))
    app.use(bodyParser.json({ limit: '50mb' }))
    app.use('/api', homeRouter)
    app.use('/api/alert', alertRouter)
    app.use('/api/book-of-business', bookOfBusinessRouter)
    app.use('/api/company', companyRouter)
    app.use('/api/deadline', deadlineRouter)
    app.use('/api/event', eventRouter)
    app.use('/api/nomination', nominationRouter)
    app.use('/api/nominee', nomineeRouter)
    app.use('/api/notification', notificationRouter)
    app.use('/api/oauth', oauthRouter)
    app.use('/api/role', roleRouter)
    app.use('/api/seat-allocation', seatAllocationRouter)
    app.use('/api/segment-seat-allocation', segmentSeatAllocationRouter)
    app.use('/api/end-customer-seat-allocation', endCustomerSeatAllocationRouter)
    app.use('/api/task-queue', taskQueueRouter)
    app.use('/api/team', teamRouter)
    app.use('/api/user', userRouter)
    // app.use('/api/mongodb', mongoDbRouter)
    app.use('/api/user-bc-team-company', userBcTeamCompanyRouter)
    app.use('/api/user-gml-team-company', userGmlTeamCompanyRouter)
    app.use('/api/user-platform-company', userPlatformCompanyRouter)
    app.use('/api/wave', waveRouter)

    app.use('/api/cron', cronRouter)
    app.use('/api/webhook', webhookRouter)

    if (process.env.NODE_ENV === 'production') {
      app.get('*', (_req, res) => {
        res.sendFile(path.join(frontendBuildDir, frontendIndexFile))
      })
    }

    return new Promise<void>((resolve, _reject) => {
      server = app.listen(
        port,
        (): void => {
          if (!silent) {
            // tslint:disable-next-line no-console
            console.log(`App listening on port ${port}!`)
          }
          process.on('SIGTERM', async () => {
            server.close(async () => {
              await mongodbManager.disconnect()
            })
          })
          resolve()
        },
      )
    })
  }

  const stop = async () => {
    if (typeof server !== 'undefined') {
      server.close()
    }
  }

  return Object.freeze({
    disconnectDatabase,
    start,
    stop,
  })
}
