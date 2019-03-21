import { baseEnvironment } from './_base-environment';

export const environment = baseEnvironment;
environment.production = true;
environment.baseHref = '/ginas/app/beta/';
environment.appId = 'inxight';

export { InxightModule as EnvironmentModule } from '../app/inxight.module';
