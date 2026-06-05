import request from 'supertest';
import { describe, expect, it } from "vitest";
import { makeApp } from "./helpers/server";

describe('GET /health', () => {

  it('returns 200 with status ok.', async () => {
   const res = await request(makeApp()).get('/health')
   expect(res.status).toBe(200);
   expect(res.body).toEqual({ status: 'ok' });
  });
});