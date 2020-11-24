import winston, { format } from 'winston';
import { join } from 'path';
import { MESSAGE } from 'triple-beam';
const { combine, timestamp } = format;

export interface LoggerOpt {
  service: string | false;
}

const defaultOptions: LoggerOpt = {
  service: 'sipp',
}

export class Logger {

  constructor(private readonly logger: winston.Logger, private readonly opt: LoggerOpt = defaultOptions) {
    this.logger.format = this.fmt();
  }
  private fmt(): winston.Logform.Format {
    const fmtStack: winston.Logform.Format[] = [
      timestamp(),
      this.addServiceLabel(),
      this.formatter()
    ];
    return combine(...fmtStack);
  }

  private addServiceLabel(): winston.Logform.Format {
    return {
      transform: (info) => {
        if (this.opt.service) {
          info.svc = this.opt.service;
        }
        return info;
      }
    }
  }

  private formatter(): winston.Logform.Format {
    return {
      transform: (info) => {
        const message = Object
          .keys(info)
          .sort()
          .map((key) => {
            return `${key}="${info[key]}"`;
          })
          .filter(x => x)
          .join(' ');
        info.message = message;
        info[MESSAGE] = message;
        return info;
      }
    }
  }

  public scopedLogger(scoping: any): ScopedLogger {
    return new ScopedLogger(this.logger, scoping);
  }

  public emergency(msg: any): Logger {
    this.logger.emerg(msg);
    return this;
  }

  public alert(msg: any): Logger {
    this.logger.alert(msg);
    return this;
  }

  public critical(msg: any): Logger {
    this.logger.crit(msg);
    return this;
  }

  public error(msg: any): Logger {
    this.logger.error(msg);
    return this;
  }

  public warn(msg: any): Logger {
    this.logger.warn(msg);
    return this;
  }

  public notice(msg: any): Logger {
    this.logger.notice(msg);
    return this;
  }

  public info(msg: any): Logger {
    this.logger.info(msg);
    return this;
  }

  public debug(msg: any): Logger {
    this.logger.debug(msg);
    return this;
  }

  public setServiceLabel(label: string) {
    this.opt.service = label;
  }

  /**
   * Sets logging level for all transports
   */
  public setLevel(level: LOG_LEVELS): Logger {
    this.logger.transports.forEach((transport) => {
      transport.level = level;
    });
    return this;
  }

  /**
   * Adds a transport to the existing transports
   */
  public addTransport(transport: winston.transport): Logger {
    this.logger.add(transport);
    return this;
  }

  /**
   * Removes all log transports and uses the given transport
   */
  public setTransport(transport: winston.transport): Logger {
    this.logger.clear().add(transport);
    return this;
  }
}

export class ScopedLogger {
  constructor(private readonly logger: winston.Logger, private readonly scoping: object) { }

  private log(level: LOG_LEVELS, message: any) {
    return this.logger.log(Object.assign({
      level,
      message
    }, this.scoping))
  }

  addScope(scoping: object, force?: boolean): void {
    Object.keys(scoping).forEach((key) => {
      if (!{}.hasOwnProperty.call(this.scoping, key) || force) {
        this.scoping[key] = scoping[key];
      }
    });
  }

  public emergency(msg: any): ScopedLogger {
    this.log(LOG_LEVELS.EMERGENCY, msg);
    return this;
  }

  public alert(msg: any): ScopedLogger {
    this.log(LOG_LEVELS.ALERT, msg);
    return this;
  }

  public critical(msg: any): ScopedLogger {
    this.log(LOG_LEVELS.CRITICAL, msg);
    return this;
  }

  public error(msg: any): ScopedLogger {
    this.log(LOG_LEVELS.ERROR, msg);
    return this;
  }

  public warn(msg: any): ScopedLogger {
    this.log(LOG_LEVELS.WARN, msg);
    return this;
  }

  public notice(msg: any): ScopedLogger {
    this.log(LOG_LEVELS.NOTICE, msg);
    return this;
  }

  public info(msg: any): ScopedLogger {
    this.log(LOG_LEVELS.INFO, msg);
    return this;
  }

  public debug(msg: any): ScopedLogger {
    this.log(LOG_LEVELS.DEBUG, msg);
    return this;
  }
}

export enum LOG_LEVELS {
  EMERGENCY = 'emergency',
  ALERT = 'alert',
  CRITICAL = 'critical',
  ERROR = 'error',
  WARN = 'warning',
  NOTICE = 'notice',
  INFO = 'info',
  DEBUG = 'debug',
}

export const formats = format;

export const consoleTransport = new winston.transports.Console({
  level: process.env.NODE_ENV === 'production' ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG
});

export const fileTransport = new winston.transports.File({
  level: process.env.NODE_ENV === 'production' ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG,
  filename: join(process.cwd(), 'tmp', 'combined.log'),
});

export const logger = new Logger(winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG,
  levels: winston.config.syslog.levels,
  transports: [consoleTransport, fileTransport]
}));

export default logger;