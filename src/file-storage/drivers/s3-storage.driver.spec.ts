import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { S3StorageDriver } from './s3-storage.driver';

jest.mock('@aws-sdk/client-s3', () => {
  const original = jest.requireActual<Record<string, unknown>>('@aws-sdk/client-s3');
  return {
    ...original,
    S3Client: jest.fn(),
  };
});
jest.mock('@aws-sdk/s3-request-presigner');

describe('S3StorageDriver', () => {
  let driver: S3StorageDriver;
  let mockS3ClientInstance: jest.Mocked<S3Client>;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockS3ClientInstance = {
      send: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<S3Client>;

    (S3Client as jest.Mock).mockImplementation(() => mockS3ClientInstance);
    (getSignedUrl as jest.Mock).mockResolvedValue('http://signed-url');

    const module = await Test.createTestingModule({
      providers: [
        S3StorageDriver,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              if (key === 'S3_BUCKET') return 'anubis';
              if (key === 'S3_ENDPOINT') return 'http://localhost:9000';
              if (key === 'S3_REGION') return 'us-east-1';
              if (key === 'S3_ACCESS_KEY_ID') return 'minioadmin';
              if (key === 'S3_SECRET_ACCESS_KEY') return 'minioadmin';
              return null;
            }),
            get: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    driver = module.get<S3StorageDriver>(S3StorageDriver);
  });

  it('should call S3 send on upload with correct arguments', async () => {
    const fileBuffer = Buffer.from('test');
    await driver.upload({ key: 'test-key', buffer: fileBuffer, mimeType: 'text/plain' });

    expect(mockS3ClientInstance.send).toHaveBeenCalledTimes(1);
    const command = mockS3ClientInstance.send.mock.calls[0][0];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toEqual({
      Bucket: 'anubis',
      Key: 'test-key',
      Body: fileBuffer,
      ContentType: 'text/plain',
    });
  });

  it('should call S3 send on delete with correct arguments', async () => {
    await driver.delete('test-key');

    expect(mockS3ClientInstance.send).toHaveBeenCalledTimes(1);
    const command = mockS3ClientInstance.send.mock.calls[0][0];
    expect(command).toBeInstanceOf(DeleteObjectCommand);
    expect(command.input).toEqual({
      Bucket: 'anubis',
      Key: 'test-key',
    });
  });

  it('should generate signed url with correct arguments', async () => {
    const url = await driver.getSignedDownloadUrl('test-key', 7200);

    expect(getSignedUrl).toHaveBeenCalledTimes(1);
    const [client, command, options] = (getSignedUrl as jest.Mock).mock.calls[0] as [
      S3Client,
      GetObjectCommand,
      { expiresIn: number },
    ];
    expect(client).toBe(mockS3ClientInstance);
    expect(command).toBeInstanceOf(GetObjectCommand);
    expect(command.input).toEqual({
      Bucket: 'anubis',
      Key: 'test-key',
    });
    expect(options).toEqual({ expiresIn: 7200 });
    expect(url).toBe('http://signed-url');
  });

  it('should initialize a separate S3Client for presigning when S3_PUBLIC_ENDPOINT is configured', () => {
    const configGetMock = jest.fn().mockImplementation((key: string) => {
      if (key === 'S3_PUBLIC_ENDPOINT') return 'http://localhost:9000';
      return null;
    });

    (S3Client as jest.Mock).mockClear();

    const customDriver = new S3StorageDriver({
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        if (key === 'S3_BUCKET') return 'anubis';
        if (key === 'S3_ENDPOINT') return 'http://rustfs:9000';
        if (key === 'S3_REGION') return 'us-east-1';
        if (key === 'S3_ACCESS_KEY_ID') return 'minioadmin';
        if (key === 'S3_SECRET_ACCESS_KEY') return 'minioadmin';
        return null;
      }),
      get: configGetMock,
    } as unknown as ConfigService);

    expect(S3Client).toHaveBeenCalledTimes(2);
    expect(S3Client).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        endpoint: 'http://rustfs:9000',
      }),
    );
    expect(S3Client).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        endpoint: 'http://localhost:9000',
      }),
    );
  });
});
