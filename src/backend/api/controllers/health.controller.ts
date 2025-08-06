import { Request, Response } from 'express';

/**
 * Controller per verificare lo stato del servizio
 */
export const healthController = {
  /**
   * Verifica lo stato del servizio
   */
  check: (req: Request, res: Response) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'app-frantoi-api',
      version: process.env.npm_package_version || '0.1.0'
    });
  }
};