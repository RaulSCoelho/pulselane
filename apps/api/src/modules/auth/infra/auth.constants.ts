export const ACCESS_TOKEN_TTL_SECONDS = Number(
  process.env.ACCESS_TOKEN_TTL_SECONDS ?? 900,
);
export const REFRESH_TOKEN_TTL_DAYS = Number(
  process.env.REFRESH_TOKEN_TTL_DAYS ?? 30,
);

export const REFRESH_COOKIE_NAME = 'refresh_token';
export const DEVICE_COOKIE_NAME = 'device_id';
