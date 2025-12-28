import config from './config/config';
import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { logger } from './config/logger';
import authRoutes from './modules/auth/auth.routes';
import productsRoutes from './modules/products/products.routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

const app: Application = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3003',
    credentials: true,
  }),
);
app.use(cookieParser());

app.use(express.json());
app.use('/auth', authRoutes);
app.use('/products', productsRoutes);
app.use(errorHandler);
app.use(requestLogger);

const { port } = config;

app.listen(port, () => {
  logger.info(`app is running at http://localhost:${port}`);
});
