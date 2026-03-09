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
        storageName: 'media_storage',
        containerName: 'media-assets',
        directories: ['**'],
      }
      const metadata = createMetadata('data-processing/incoming-data/records.csv')

      const result = validateMetadata(configuration, metadata)

      expect(result).to.be.false
    })

    it('returns false when container name is a substring but not exact match', () => {
      const configuration: RocketFilesUserConfiguration = {
        storageName: 'test_storage',
        containerName: 'data',
        directories: ['**'],
      }
      const metadata = createMetadata('data-processing/incoming-data/file.csv')

      const result = validateMetadata(configuration, metadata)

      expect(result).to.be.false
    })

    it('returns true when container name matches and directory pattern matches', () => {
      const configuration: RocketFilesUserConfiguration = {
        storageName: 'ingestion_storage',
        containerName: 'data-processing',
        directories: ['incoming-data'],
      }
      const metadata = createMetadata('data-processing/incoming-data/records.csv')

      const result = validateMetadata(configuration, metadata)

      expect(result).to.be.true
    })

    it('returns true when container name matches with wildcard directory pattern', () => {
      const configuration: RocketFilesUserConfiguration = {
        storageName: 'media_storage',
        containerName: 'media-assets',
        directories: ['**'],
      }
      const metadata = createMetadata('media-assets/some-dir/file.txt')

      const result = validateMetadata(configuration, metadata)

      expect(result).to.be.true
    })
  })

  describe('directory validation with correct container', () => {
    it('returns false when container matches but directory does not', () => {
      const configuration: RocketFilesUserConfiguration = {
        storageName: 'ingestion_storage',
        containerName: 'data-processing',
        directories: ['incoming-data'],
      }
      const metadata = createMetadata('data-processing/other-directory/file.csv')

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
    const wildcardConfig: RocketFilesUserConfiguration = {
      storageName: 'media_storage',
      containerName: 'media-assets',
      directories: ['**'],
    }

    const specificDirConfig: RocketFilesUserConfiguration = {
      storageName: 'ingestion_storage',
      containerName: 'data-processing',
      directories: ['incoming-data'],
    }

    it('only one configuration matches for data-processing upload', () => {
      const metadata = createMetadata('data-processing/incoming-data/records.csv')

      const wildcardResult = validateMetadata(wildcardConfig, metadata)
      const specificResult = validateMetadata(specificDirConfig, metadata)

      expect(wildcardResult).to.be.false
      expect(specificResult).to.be.true
    })

    it('only one configuration matches for media-assets upload', () => {
      const metadata = createMetadata('media-assets/documents/report.pdf')

      const wildcardResult = validateMetadata(wildcardConfig, metadata)
      const specificResult = validateMetadata(specificDirConfig, metadata)

      expect(wildcardResult).to.be.true
      expect(specificResult).to.be.false
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

