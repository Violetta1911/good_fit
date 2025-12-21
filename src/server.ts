import config from './config/config';
import express, { Application } from 'express';
import productsRoutes from './modules/products/products.routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './config/logger';

const app: Application = express();

app.use(express.json());
app.use('/', productsRoutes);
app.use(errorHandler);

const { port } = config;

app.listen(port, () => {
  logger.info(`app is running at http://localhost:${port}`);
});
