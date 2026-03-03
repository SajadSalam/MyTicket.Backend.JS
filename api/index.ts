import { INestApplication } from '@nestjs/common';
import express from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../src/main';

type ExpressHandler = (req: IncomingMessage, res: ServerResponse) => void;

let cachedApp: ExpressHandler | null = null;
let nestApp: INestApplication | null = null;

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (!cachedApp || !nestApp) {
    const expressApp = express();
    nestApp = await createApp(expressApp);
    // Get the Express instance from NestJS HTTP adapter
    const httpAdapter = nestApp.getHttpAdapter();
    cachedApp = httpAdapter.getInstance() as unknown as ExpressHandler;
  }

  if (cachedApp) {
    cachedApp(req, res);
  }
}
