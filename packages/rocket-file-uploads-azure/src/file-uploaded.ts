import { RocketFilesUserConfiguration } from '@boostercloud/rocket-file-uploads-types/dist/rocket-files-params'
import { isValidDirectory } from '@boostercloud/rocket-file-uploads-types/dist/utils'
import { InvocationContext } from '@azure/functions'
import * as path from 'path'

export function getMetadataFromRequest(request: unknown): Record<string, unknown> {
  // v4 format: { blob, context } where context is InvocationContext with triggerMetadata
  const { context } = request as { blob: Buffer; context: InvocationContext }
  return context.triggerMetadata as Record<string, unknown>
}

export function validateMetadata(configuration: RocketFilesUserConfiguration, metadata: Record<string, unknown>): boolean {
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
