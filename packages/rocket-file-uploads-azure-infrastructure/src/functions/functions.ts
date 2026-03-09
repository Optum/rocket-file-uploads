import {
  ApplicationSynthStack,
  FunctionAppV4Definitions,
  RocketUtils,
} from '@boostercloud/framework-provider-azure-infrastructure'
import { BoosterConfig } from '@boostercloud/framework-types'
import { RocketFilesConfiguration } from '@boostercloud/rocket-file-uploads-types'
import { getFunctionAppName } from '../helper'
import { RocketFilesFileUploadedFunction } from './rocket-files-file-uploaded-function'

export class Functions {
  static async mountFunctionsV4(
    configuration: RocketFilesConfiguration,
    _config: BoosterConfig,
    applicationSynthStack: ApplicationSynthStack,
    _utils: RocketUtils,
  ): Promise<FunctionAppV4Definitions> {
    const functionAppName = getFunctionAppName(applicationSynthStack)

    // Generate v4 functions.js code for all configured storage containers
    const functionsCode = configuration.userConfiguration
      .map((userConfiguration) =>
        RocketFilesFileUploadedFunction.generateFunctionsCode(
          userConfiguration.containerName,
          userConfiguration.storageName,
        ),
      )
      .join('\n')

    return [
      {
        functionAppName,
        functionsCode,
      },
    ]
  }

  static getFunctionAppName(
    configuration: RocketFilesConfiguration,
    applicationSynthStack: ApplicationSynthStack,
  ): string {
    return getFunctionAppName(applicationSynthStack)
  }
}
