import config from './config/config';
import express, { Application } from 'express';
import productsRoutes from './modules/products/products.routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './config/logger';
import { requestLogger } from './middleware/requestLogger';

const app: Application = express();

app.use(express.json());
app.use('/', productsRoutes);
app.use(errorHandler);
app.use(requestLogger);

const { port } = config;

app.listen(port, () => {
  logger.info(`app is running at http://localhost:${port}`);
});
