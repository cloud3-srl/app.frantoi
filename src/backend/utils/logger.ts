/**
 * Semplice classe per il logging in console.
 * In un'implementazione reale si dovrebbe utilizzare una libreria più robusta come Winston.
 */
export class Logger {
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: string, message: string): string {
    return `[${this.getTimestamp()}] [${level}] [${this.context}] ${message}`;
  }

  info(message: string, ...args: any[]): void {
    console.info(this.formatMessage('INFO', message), ...args);
  }

  debug(message: string, ...args: any[]): void {
    console.debug(this.formatMessage('DEBUG', message), ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage('WARN', message), ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(this.formatMessage('ERROR', message), ...args);
  }
}

// Esporta un'istanza predefinita per uso globale
export const logger = new Logger('AppFrantoi');