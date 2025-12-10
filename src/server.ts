import config from './config/config';
import express, { Application } from 'express';
import productsRoutes from './modules/products/products.routes';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

app.use(express.json());
app.use('/', productsRoutes);
app.use(errorHandler);

const { port } = config;

app.listen(port, () => {
  console.log(`app is running at http://localhost:${port}`);
});
