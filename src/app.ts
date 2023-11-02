import express from 'express';
import apiRoutes from './api/routes';
import config from './config';

const app = express();

app.use(express.json());

app.use(config.apiPrefix, apiRoutes);

export default app;
