import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { put } from '@vercel/blob';
import { memoryStorage } from 'multer';

const STORAGE = memoryStorage();
const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10 MB

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  // ─── Single file ────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Upload a single file and get its URL' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload (max 10 MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', example: 'https://xxxx.public.blob.vercel-storage.com/photo.jpg' },
        filename: { type: 'string', example: 'photo.jpg' },
        size: { type: 'number', example: 204800 },
        mimeType: { type: 'string', example: 'image/jpeg' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'No file provided' })
  @Post()
  @UseInterceptors(
    FileInterceptor('file', { storage: STORAGE, limits: { fileSize: FILE_SIZE_LIMIT } }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<object> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const blob = await put(file.originalname, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
      addRandomSuffix: true,
    });

    return {
      url: blob.url,
      filename: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  // ─── Multiple files ─────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Upload multiple files and get their URLs (max 20 files)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Files to upload (max 20 files, 10 MB each)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string', example: 'https://xxxx.public.blob.vercel-storage.com/photo.jpg' },
              filename: { type: 'string', example: 'photo.jpg' },
              size: { type: 'number', example: 204800 },
              mimeType: { type: 'string', example: 'image/jpeg' },
            },
          },
        },
        count: { type: 'number', example: 3 },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'No files provided' })
  @Post('multiple')
  @UseInterceptors(
    FilesInterceptor('files', 20, { storage: STORAGE, limits: { fileSize: FILE_SIZE_LIMIT } }),
  )
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<object> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploaded = await Promise.all(
      files.map(async (file) => {
        const blob = await put(file.originalname, file.buffer, {
          access: 'public',
          contentType: file.mimetype,
          addRandomSuffix: true,
        });
        return {
          url: blob.url,
          filename: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        };
      }),
    );

    return {
      files: uploaded,
      count: uploaded.length,
    };
  }
}
