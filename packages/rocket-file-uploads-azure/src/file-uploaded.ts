import { RocketFilesUserConfiguration } from '@boostercloud/rocket-file-uploads-types/dist/rocket-files-params'
import { isValidDirectory } from '@boostercloud/rocket-file-uploads-types/dist/utils'
import { Context, ContextBindingData } from '@azure/functions'
import * as path from 'path'

export function getMetadataFromRequest(request: unknown): ContextBindingData {
  return (request as Context).bindingData
}

export function validateMetadata(configuration: RocketFilesUserConfiguration, metadata: ContextBindingData): boolean {
  const blobTrigger = metadata.blobTrigger as string

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
