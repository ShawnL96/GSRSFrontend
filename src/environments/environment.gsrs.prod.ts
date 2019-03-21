import { baseEnvironment } from './_base-environment';

export const environment = baseEnvironment;
environment.production = true;
environment.baseHref = '/ginas/app/beta/';
environment.appId = 'gsrs';
environment.googleAnalyticsId = 'UA-136176848-1';

export { GsrsModule as EnvironmentModule } from '../app/gsrs.module';
