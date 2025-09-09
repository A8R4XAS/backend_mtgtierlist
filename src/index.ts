import 'source-map-support/register';

// 3p
import { Config, createApp, Logger, ServiceManager } from '@foal/core';

// App
import { AppController } from './app/app.controller';
import { dataSource } from './db';


const corsPreMiddleware = (req: any, res: any, next: any) => {
  const allowedOriginsStr = Config.get('settings.cors.allowedOrigins', 'string', '[]');
  const allowedOrigins: string[] = JSON.parse(allowedOriginsStr);

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.header('Access-Control-Allow-Methods', 'HEAD, GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
};

async function main() {

  dataSource.initialize()
  .then(() => {
    console.log('DB synced');
  })
  .catch(err => console.error('DB error:', err));


  const serviceManager = new ServiceManager();
  const logger = serviceManager.get(Logger);

  const app = await createApp( AppController,{ serviceManager, preMiddlewares: [corsPreMiddleware]});

  const port = Config.get('port', 'number', 3001);
  app.listen(port, () => logger.info(`Listening on port ${port}...`));
}

main()
  .catch(err => { console.error(err.stack); process.exit(1); });
