import config from './config/config';
import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { logger } from './config/logger';
import authRoutes from './modules/auth/auth.routes';
//import productsRoutes from './modules/products/products.routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import healthRoutes from './modules/health/health.routes'; // Import the health routes

const { port, frontendUrl } = config;

export function buildApp(): Application {
  const app = express();
  app.use(cors({ origin: frontendUrl, credentials: true }));
  app.use(cookieParser());

  app.use(express.json());
  app.use(requestLogger);
  app.use('/health', healthRoutes);
  app.use('/auth', authRoutes);
  //app.use('/products', productsRoutes);
  app.use(errorHandler);
  return app;
}
if (require.main === module) {
  const app = buildApp();
  app.listen(port, () => {
    logger.info(`app is running at http://localhost:${port}`);
  });
}
