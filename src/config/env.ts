import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  port: number;
  natsServers: string[];
  databaseUrl: string;
  jwtSecret: string;
}

const schema = joi
  .object({
    PORT: joi.number().required(),
    NATS_SERVERS: joi.array().items(joi.string()).required(),
    DATABASE_URL: joi.string().required(),
    JWT_SECRET: joi.string().required(),
  })
  .unknown(true);

const { value, error } = schema.validate({
  ...process.env,
  NATS_SERVERS: process.env.NATS_SERVERS.split(','),
});
if (error) {
  throw new Error(`Validate config error ${error.message}`);
}

export const env: EnvVars = {
  port: value.PORT,
  natsServers: value.NATS_SERVERS,
  databaseUrl: value.DATABASE_URL,
  jwtSecret: value.JWT_SECRET,
};
