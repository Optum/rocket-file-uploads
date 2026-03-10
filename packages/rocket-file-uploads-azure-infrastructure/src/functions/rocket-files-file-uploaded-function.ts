const VALID_NAME_PATTERN = /^[a-z0-9_-]+$/

function validateName(value: string, label: string): void {
  if (!VALID_NAME_PATTERN.test(value)) {
    throw new Error(
      `Invalid ${label}: "${value}". Must match ${VALID_NAME_PATTERN}.`,
    )
  }
}

export class RocketFilesFileUploadedFunction {
  static generateFunctionsCode(
    containerName: string,
    storageName: string,
  ): string {
    validateName(containerName, 'containerName')
    validateName(storageName, 'storageName')

    const functionName = `fileupload_${storageName}`

    return `
const { app } = require('@azure/functions')
const { boosterRocketDispatcher } = require('./dist/index')

app.storageBlob('${functionName}', {
  path: '${containerName}/{name}',
  connection: '${storageName}',
  handler: async (blob, context) => {
    return await boosterRocketDispatcher({ blob, context })
  }
})
`
  }
}
