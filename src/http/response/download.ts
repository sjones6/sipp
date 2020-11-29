import { ReadStream } from 'fs';
import { extname, basename } from 'path';
import mime from 'mime-types';
import { Response } from 'express';

export type Downloadable = string | ReadStream | Buffer | object | Array<any>;

export class Download<DownloadType> {
  static from(
    download: Downloadable,
    mimeType?: string,
    fileName?: string,
  ): StreamDownload | PathDownload | BufferDownload {
    switch (true) {
      case download instanceof Buffer:
        return new BufferDownload(download as Buffer, mimeType, fileName);
      case typeof download === 'string':
        return new PathDownload(
          download as string,
          mimeType || mime.lookup(extname(download as string)),
          fileName,
        );
      case download instanceof ReadStream:
        return new StreamDownload(download as ReadStream, mimeType, fileName);
      case typeof download.toString === 'function':
        return new BufferDownload(
          Buffer.from(JSON.stringify(download)),
          'application/json',
          fileName,
        );
      default:
        throw new Error(`invalid download`);
    }
  }

  constructor(
    public readonly download: DownloadType,
    public readonly mimeType?: string,
    public readonly fileName: string = 'download',
  ) {
    this.mimeType =
      mimeType || (fileName && mime.lookup(extname(fileName))) || 'text/plain';
  }

  public getFileName(): string {
    if (extname(this.fileName)) {
      return this.fileName;
    }
    return `${this.fileName}.${mime.extension(this.mimeType) || 'txt'}`;
  }
}

export class StreamDownload extends Download<ReadStream> {
  handle(res: Response) {
    this.download.pipe(res);
  }
}

export class BufferDownload extends Download<Buffer> {
  handle(res: Response) {
    res.end(this.download);
  }
}

export class PathDownload extends Download<string> {
  handle(res: Response) {
    let fileName = this.fileName;
    if (!extname(this.fileName)) {
      fileName = `${this.fileName}${extname(this.download)}`;
    }
    res.download(this.download, fileName);
  }

  public getFileName(): string {
    if (!this.fileName) {
      return basename(this.download);
    }
    if (extname(this.fileName)) {
      return this.fileName;
    }
    return `${this.fileName}${
      this.mimeType
        ? mime.extension(this.mimeType)
        : extname(this.download) || 'txt'
    }`;
  }
}
