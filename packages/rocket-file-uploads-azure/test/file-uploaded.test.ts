import { expect } from 'chai'
import { getMetadataFromRequest, validateMetadata } from '../src/file-uploaded'

// Define locally to match the type without importing from the types package
interface RocketFilesUserConfiguration {
  storageName: string
  directories: Array<string>
  containerName: string
}


describe('validateMetadata', () => {
  const createMetadata = (blobTrigger: string): Record<string, unknown> => ({
    blobTrigger,
    invocationId: 'test-invocation-id',
  })

  describe('container name validation', () => {
    it('returns false when container name does not match, even with wildcard directory pattern', () => {
      const configuration: RocketFilesUserConfiguration = {
        storageName: 'cms_storage',
        containerName: 'cloud-storage',
        directories: ['**'],
      }
      const metadata = createMetadata('offer-processing/active-offer-pool/current-offers.csv')

      const result = validateMetadata(configuration, metadata)

      expect(result).to.be.false
    })

    it('returns false when container name is a substring but not exact match', () => {
      const configuration: RocketFilesUserConfiguration = {
        storageName: 'test_storage',
        containerName: 'offer',
        directories: ['**'],
      }
      const metadata = createMetadata('offer-processing/active-offer-pool/file.csv')

      const result = validateMetadata(configuration, metadata)

      expect(result).to.be.false
    })

    it('returns true when container name matches and directory pattern matches', () => {
      const configuration: RocketFilesUserConfiguration = {
        storageName: 'offer_intake_storage',
        containerName: 'offer-processing',
        directories: ['active-offer-pool'],
      }
      const metadata = createMetadata('offer-processing/active-offer-pool/current-offers.csv')

      const result = validateMetadata(configuration, metadata)

      expect(result).to.be.true
    })

    it('returns true when container name matches with wildcard directory pattern', () => {
      const configuration: RocketFilesUserConfiguration = {
        storageName: 'cms_storage',
        containerName: 'cloud-storage',
        directories: ['**'],
      }
      const metadata = createMetadata('cloud-storage/some-dir/file.txt')

      const result = validateMetadata(configuration, metadata)

      expect(result).to.be.true
    })
  })

  describe('directory validation with correct container', () => {
    it('returns false when container matches but directory does not', () => {
      const configuration: RocketFilesUserConfiguration = {
        storageName: 'offer_intake_storage',
        containerName: 'offer-processing',
        directories: ['active-offer-pool'],
      }
      const metadata = createMetadata('offer-processing/other-directory/file.csv')

      const result = validateMetadata(configuration, metadata)

      expect(result).to.be.false
    })

    it('returns true for nested directory with globstar pattern', () => {
      const configuration: RocketFilesUserConfiguration = {
        storageName: 'file_upload_storage',
        containerName: 'file-upload-processing',
        directories: ['active-pool/**'],
      }
      const metadata = createMetadata('file-upload-processing/active-pool/sales-fdm/report.csv')

      const result = validateMetadata(configuration, metadata)

      expect(result).to.be.true
    })

    it('returns true for file in root directory with single star pattern', () => {
      const configuration: RocketFilesUserConfiguration = {
        storageName: 'test_storage',
        containerName: 'test-container',
        directories: ['*'],
      }
      const metadata = createMetadata('test-container/any-folder/file.txt')

      const result = validateMetadata(configuration, metadata)

      expect(result).to.be.true
    })
  })

  describe('duplicate event prevention scenarios', () => {
    const cmsConfig: RocketFilesUserConfiguration = {
      storageName: 'cms_storage',
      containerName: 'cloud-storage',
      directories: ['**'],
    }

    const offerIntakeConfig: RocketFilesUserConfiguration = {
      storageName: 'offer_intake_storage',
      containerName: 'offer-processing',
      directories: ['active-offer-pool'],
    }

    it('only one configuration matches for offer-processing upload', () => {
      const metadata = createMetadata('offer-processing/active-offer-pool/current-offers.csv')

      const cmsResult = validateMetadata(cmsConfig, metadata)
      const offerResult = validateMetadata(offerIntakeConfig, metadata)

      expect(cmsResult).to.be.false
      expect(offerResult).to.be.true
    })

    it('only one configuration matches for cloud-storage upload', () => {
      const metadata = createMetadata('cloud-storage/documents/report.pdf')

      const cmsResult = validateMetadata(cmsConfig, metadata)
      const offerResult = validateMetadata(offerIntakeConfig, metadata)

      expect(cmsResult).to.be.true
      expect(offerResult).to.be.false
    })
  })
})

describe('getMetadataFromRequest', () => {
  it('extracts triggerMetadata from Azure Functions v4 InvocationContext', () => {
    const mockRequest = {
      blob: Buffer.from('test content'),
      context: {
        triggerMetadata: {
          blobTrigger: 'test-container/test-path/file.txt',
          invocationId: 'test-id',
        }
      }
    }

    const result = getMetadataFromRequest(mockRequest)

    expect(result).to.deep.equal(mockRequest.context.triggerMetadata)
  })
})

