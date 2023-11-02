import { IEnvironmentConfig, IFullConfig } from '../interfaces/config.interface';
import developmentConfig from './development';
import productionConfig from './production';

const globalConfig = {
  apiPrefix: '/api/v1',
};

let environmentConfig: IEnvironmentConfig = developmentConfig

switch (process.env.NODE_ENV) {
  case 'production':
    environmentConfig = productionConfig;
    break;
}

const config: IFullConfig = { ...globalConfig, ...environmentConfig };

export default config;
