import { Application } from 'express';
import { buildApp } from '../../src/server';

export function makeApp(): Application {
  return buildApp();
}