import { RequestMethod } from '@nestjs/common';

export const EXCLUDED_ROUTES = [
  {
    path: 'health-check',
    method: RequestMethod.GET,
  },
  {
    path: 'health',
    method: RequestMethod.GET,
  },
  {
    path: 'shop/(.*)',
    method: RequestMethod.ALL,
  },
  {
    path: 'auth/(.*)',
    method: RequestMethod.ALL,
  },
  {
    path: 'equipment/(.*)',
    method: RequestMethod.ALL,
  },
  {
    path: 'admin/(.*)',
    method: RequestMethod.ALL,
  }
];
