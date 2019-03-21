import { baseEnvironment } from './_base-environment';

export const environment = baseEnvironment;
environment.production = true;
environment.baseHref = '/ginas/app/beta/';
environment.appId = 'abase';

export { AbaseModule as EnvironmentModule } from '../app/abase.module';
