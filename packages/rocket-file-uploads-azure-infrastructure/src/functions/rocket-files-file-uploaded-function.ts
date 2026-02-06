import { BoosterConfig } from '@boostercloud/framework-types'

export class RocketFilesFileUploadedFunction {
  static generateFunctionsCode(
    config: BoosterConfig,
    containerName: string,
    storageName: string,
  ): string {
    const functionName = `fileupload_${storageName}`

    return `
const { app } = require('@azure/functions')
const { boosterRocketDispatcher } = require('./dist/index')

app.storageBlob('${functionName}', {
  path: '${containerName}/{name}',
  connection: '${storageName}',
  handler: async (blob, context) => {
    return await boosterRocketDispatcher.dispatch({ blob, context })
  }
})
`
  }
}
