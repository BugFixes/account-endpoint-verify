const bugfixes = require('bugfixes')
const AccountModel = require('bugfixes-account-models')
const Logs = require('bugfixes-account-logging')

const bugfunctions = bugfixes.functions

module.exports = (event, context, callback) => {
  const log = new Logs()
  log.action = 'account-verify'

  let eventBody = JSON.parse(event.body)

  let requestId = null
  if (event.requestContext.requestId) {
    requestId = event.requestContext.requestId

    log.requestId = requestId
  }
  log.authyId = eventBody.authyId
  log.content = {
    apiKey: event.requestContext.identity.apiKey,
    email: eventBody.email
  }

  let account = new AccountModel()
  account.email = eventBody.email
  account.verify = eventBody.verify
  account.authyId = eventBody.authyId
  account.verifyAccount((error, result) => {
    if (error) {
      log.content.error = error
      log.send()

      return callback(error)
    }

    if (result.success) {
      log.send()

      return callback(null, bugfunctions.lambdaResult(300, {
        requestId: requestId,
        accountId: result.accountId,
        success: result.success
      }))
    }

    bugfixes.info('result', result)

    log.send()
    return callback(null, bugfunctions.lambdaError(301, result))
  })
}
