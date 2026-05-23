import * as fs from 'fs';
import * as path from 'path';
import environmentsJson from '../config/environments.json';

type EnvName = keyof typeof environmentsJson.environments;

interface EnvConfig {
  baseURL: string;
  apiBaseURL: string;
  timeout: number;
  retries: number;
}

/**
 * EnvConfig — resolves environment-specific config at runtime.
 * Tests read from this rather than scattering process.env calls.
 */
export function getEnvConfig(): EnvConfig {
  const envName = (process.env.TEST_ENV || environmentsJson.defaultEnvironment) as EnvName;
  const config  = environmentsJson.environments[envName];

  if (!config) {
    throw new Error(
      `Unknown TEST_ENV "${envName}". Valid values: ${Object.keys(environmentsJson.environments).join(', ')}`
    );
  }

  // Allow runtime overrides via process.env
  return {
    baseURL:    process.env.BASE_URL    || config.baseURL,
    apiBaseURL: process.env.API_BASE_URL || config.apiBaseURL,
    timeout:    config.timeout,
    retries:    config.retries,
  };
}

export function getCredentials(): { username: string; password: string } {
  const username = process.env.STANDARD_USER;
  const password = process.env.TEST_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'STANDARD_USER and TEST_PASSWORD must be set. Copy config/.env.example to config/.env.staging and fill in values.'
    );
  }
  return { username, password };
}
