import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { openApiDocument } from './config/openapi';
import { errorMiddleware } from './middleware/error.middleware';
import { accountRouter } from './routes/account.routes';

export const app = express();

const allowAnyOrigin = env.nodeEnv === 'production' && env.corsOrigins.length === 0;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || env.corsOrigins.includes(origin) || allowAnyOrigin) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api-docs.json', (_req, res) => {
  res.json(openApiDocument);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use('/accounts', accountRouter);
app.use(errorMiddleware);
