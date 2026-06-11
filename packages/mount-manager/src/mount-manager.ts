import {
  ChecksumOptions,
  ConfigurationOptions,
  CopyFileOptions,
  CreateDirectoryOptions,
  DirectoryListing,
  FileContents,
  FileInfo,
  FileStorage,
  ListOptions,
  MimeTypeOptions,
  MiscellaneousOptions,
  MoveFileOptions,
  PublicUrlOptions,
  StatEntry,
  TemporaryUrlOptions,
  UploadRequest,
  UploadRequestOptions,
  VisibilityOptions,
  WriteOptions
} from '@flystorage/file-storage';
import { Buffer } from "buffer";
import { Readable } from "stream";

const FILESYSTEM_SCHEME_SEPARATOR = "://";

type FileStoragePublicMethods = {
  [K in keyof FileStorage as FileStorage[K] extends (...args: any[]) => any ? K : never]: FileStorage[K];
};

export class MountManager implements FileStoragePublicMethods {
  private filesystems: Record<string, FileStorage>;

  constructor(
    filesystems: Record<string, FileStorage>,
    private readonly options: ConfigurationOptions = {},
  ) {
    this.filesystems = filesystems;
  }

  setVisibility(path: string, visibility: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public async write(path: string, contents: FileContents, options?: WriteOptions): Promise<void> {
    const { filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    return filesystem.write(relativePath, contents, options);
  }

  public async read(path: string, options?: MiscellaneousOptions): Promise<Readable> {
    const { filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    return filesystem.read(relativePath, options);
  }

  public async readToString(path: string, options?: MiscellaneousOptions): Promise<string> {
    const { filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    return filesystem.readToString(relativePath, options);
  }

  public async readToUint8Array(path: string, options?: MiscellaneousOptions): Promise<Uint8Array> {
    const { filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    return filesystem.readToUint8Array(relativePath, options);
  }

  public async readToBuffer(path: string, options?: MiscellaneousOptions): Promise<Buffer> {
    const { filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    return filesystem.readToBuffer(relativePath, options);
  }

  public async deleteFile(path: string, options?: MiscellaneousOptions): Promise<void> {
    const { filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    return filesystem.deleteFile(relativePath, options);
  }

  public async createDirectory(path: string, options?: CreateDirectoryOptions): Promise<void> {
    const { filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    return filesystem.createDirectory(relativePath, options);
  }

  public async deleteDirectory(path: string, options?: MiscellaneousOptions): Promise<void> {
    const { filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    return filesystem.deleteDirectory(relativePath, options);
  }

  public async stat(path: string, options?: MiscellaneousOptions): Promise<StatEntry> {
    const { filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    return filesystem.stat(relativePath, options);
  }

  public async moveFile(from: string, to: string, options?: MoveFileOptions): Promise<void> {
    const { filesystem: sourceFilesystem, path: relativePath } = this.determineFilesystemAndPath(from);
    const { filesystem: destinationFilesystem, path: relativeToPath } = this.determineFilesystemAndPath(to);

    if (sourceFilesystem !== destinationFilesystem) {
      return this.moveFileAcrossFilesystems(from, to, options);
    }

    return sourceFilesystem.moveFile(relativePath, relativeToPath, options);
  }

  public async copyFile(source: string, destination: string, options?: CopyFileOptions): Promise<void> {
    const { filesystem: sourceFilesystem, path: relativePath } = this.determineFilesystemAndPath(source);
    const { filesystem: destinationFilesystem, path: relativeToPath } = this.determineFilesystemAndPath(destination);

    if (sourceFilesystem !== destinationFilesystem) {
      return this.copyFileAcrossFilesystems(source, destination, options);
    }

    return sourceFilesystem.copyFile(relativePath, relativeToPath, options);
  }

  public async changeVisibility(path: string, visibility: string, options?: VisibilityOptions): Promise<void> {
    const { filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    return filesystem.changeVisibility(relativePath, visibility, options);
  }

  public async visibility(path: string, options?: VisibilityOptions): Promise<string> {
    const { filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    return filesystem.visibility(relativePath, options);
  }

  public async fileExists(path: string, options?: MiscellaneousOptions): Promise<boolean> {
    const { filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    return filesystem.fileExists(relativePath, options);
  }

  public list(path: string, options?: ListOptions): DirectoryListing {
    const { mountPoint, filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    const innerListing = filesystem.list(relativePath, options);

    const prefix = `${mountPoint}${FILESYSTEM_SCHEME_SEPARATOR}`;
    const mapped = (async function* () {
      for await (const entry of innerListing) {
        yield { ...entry, path: `${prefix}${entry.path}` };
      }
    })();

    return new DirectoryListing(mapped, path, options?.deep ?? false);
  }

  public async statFile(path: string, options?: MiscellaneousOptions): Promise<FileInfo> {
    const { filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    return filesystem.statFile(relativePath, options);
  }

  public async directoryExists(path: string, options?: MiscellaneousOptions): Promise<boolean> {
    const { filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    return filesystem.directoryExists(relativePath, options);
  }

  public async publicUrl(path: string, options?: PublicUrlOptions): Promise<string> {
    const { filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    return filesystem.publicUrl(relativePath, options);
  }

  public async temporaryUrl(path: string, options: TemporaryUrlOptions): Promise<string> {
    const { filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    return filesystem.temporaryUrl(relativePath, options);
  }

  public async prepareUpload(path: string, options: UploadRequestOptions): Promise<UploadRequest> {
    const { filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    return filesystem.prepareUpload(relativePath, options);
  }

  public async checksum(path: string, options?: ChecksumOptions): Promise<string> {
    const { filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    return filesystem.checksum(relativePath, options);
  }

  public async mimeType(path: string, options?: MimeTypeOptions): Promise<string> {
    const { filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    return filesystem.mimeType(relativePath, options);
  }

  public async lastModified(path: string, options?: MiscellaneousOptions): Promise<number> {
    const { filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    return filesystem.lastModified(relativePath, options);
  }

  public async fileSize(path: string, options?: MiscellaneousOptions): Promise<number> {
    const { filesystem, path: relativePath } = this.determineFilesystemAndPath(path);
    return filesystem.fileSize(relativePath, options);
  }

  private async copyFileAcrossFilesystems(source: string, destination: string, options: CopyFileOptions = {}): Promise<void> {
    const { filesystem: sourceFilesystem, path: relativePath } = this.determineFilesystemAndPath(source);
    const { filesystem: destinationFilesystem, path: relativeToPath } = this.determineFilesystemAndPath(destination);

    const retainVisibility = options?.retainVisibility ?? this.options.visibility?.retainVisibility ?? true;
    let visibility = options?.visibility ?? this.options.visibility?.visibility;

    if (visibility === undefined && retainVisibility) {
      visibility = await sourceFilesystem.visibility(relativePath);
      options.visibility = visibility;
    }

    const contents = await sourceFilesystem.read(relativePath, options);
    await destinationFilesystem.write(relativeToPath, contents, options);
  }

  private async moveFileAcrossFilesystems(source: string, destination: string, options?: MoveFileOptions): Promise<void> {
    await this.copyFile(source, destination, options);
    await this.deleteFile(source, options);
  }

  private determineFilesystemAndPath(path: string): { mountPoint: string, filesystem: FileStorage, path: string } {
    const schemeSeparatorIndex = path.indexOf(FILESYSTEM_SCHEME_SEPARATOR);
    if (schemeSeparatorIndex === -1) {
      throw new Error(`Invalid path: ${path}. Expected format: <filesystem>://<path>`);
    }

    const mountPoint = path.substring(0, schemeSeparatorIndex);
    const pathPart = path.substring(schemeSeparatorIndex + FILESYSTEM_SCHEME_SEPARATOR.length);

    const filesystem = this.filesystems[mountPoint];
    if (!filesystem) {
      throw new Error(`Filesystem not found for mount point: ${mountPoint}`);
    }

    return { mountPoint, filesystem, path: pathPart };
  }
}
