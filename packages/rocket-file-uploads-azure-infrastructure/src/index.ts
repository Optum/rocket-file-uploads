import { InfrastructureRocket } from '@boostercloud/framework-provider-azure-infrastructure'
import { Synth } from './synth/synth'
import { Functions } from './functions/functions'
import { RocketFilesConfiguration } from '@boostercloud/rocket-file-uploads-types'

const AzureRocketFiles = (configuration: RocketFilesConfiguration): InfrastructureRocket => ({
  mountStack: Synth.mountStack.bind(Synth, configuration),
  mountFunctionsV4: Functions.mountFunctionsV4.bind(Functions, configuration),
  getFunctionAppName: Functions.getFunctionAppName.bind(Functions, configuration),
})

export default AzureRocketFiles
