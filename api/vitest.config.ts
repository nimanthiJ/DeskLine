import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL_TEST ??
        'postgres://postgres:postgres@localhost:5432/deskline_test',
    },
    fileParallelism: false,
  },
});
