import { RocketFilesUserConfiguration } from '@boostercloud/rocket-file-uploads-types/dist/rocket-files-params'
import { isValidDirectory } from '@boostercloud/rocket-file-uploads-types/dist/utils'
import { InvocationContext } from '@azure/functions'
import * as path from 'path'

export interface BlobTriggerMetadata {
  blobTrigger: string

  [key: string]: unknown
}

export function getMetadataFromRequest(request: unknown): BlobTriggerMetadata {
  const req = request as Record<string, unknown>
  const context = req.context as InvocationContext | undefined
  if (!context?.triggerMetadata) {
    throw new Error('InvocationContext.triggerMetadata is missing for the blob upload request')
  }
  return context.triggerMetadata as BlobTriggerMetadata
}

export function validateMetadata(configuration: RocketFilesUserConfiguration, metadata: BlobTriggerMetadata): boolean {
  const blobTrigger = metadata.blobTrigger

  // Verify the container name matches first
  const containerPrefix = configuration.containerName + '/'
  if (!blobTrigger.startsWith(containerPrefix)) {
    console.info(`Ignoring blob trigger ${blobTrigger} - container name does not match ${configuration.containerName}`)
    return false
  }

  const sourceWithoutContainer = blobTrigger.slice(containerPrefix.length)
  const parsedPath = path.parse(sourceWithoutContainer)
  const sourceDirectoryPath = parsedPath.dir
  const directoryFound = isValidDirectory(sourceDirectoryPath, configuration.directories)

  if (!directoryFound) {
    console.info(`Ignoring blob trigger ${blobTrigger} - directory does not match configured directories`)
    return false
  }
  return true
}
