import winston, { format } from 'winston';
import { join } from 'path';
import { MESSAGE } from 'triple-beam';
const { combine, timestamp } = format;

export interface LoggerOpt {
  service: string | false;
}

const defaultOptions: LoggerOpt = {
  service: 'sipp',
};

export class Logger {
  private formatter: winston.Logform.Format;
  constructor(
    private readonly logger: winston.Logger,
    private readonly opt: LoggerOpt = defaultOptions,
  ) {
    this.logger.format = this.fmt();
  }

  /**
   * @param scoping object of properties to add to child
   */
  public childLogger(scoping: any): Logger {
    return new Logger(this.logger, { ...this.opt, ...scoping });
  }

  /**
   * @param scoping key=value pairs to add to the logger's scope when logging messages
   * @param force if true, it will overwrite any existing scopted values
   */
  addScope(scoping: object, force?: boolean): void {
    Object.keys(scoping).forEach((key) => {
      if (!{}.hasOwnProperty.call(this.opt, key) || force) {
        this.opt[key] = scoping[key];
      }
    });
  }

  public emergency(msg: any): Logger {
    this.log(LOG_LEVELS.EMERGENCY, msg);
    return this;
  }

  public alert(msg: any): Logger {
    this.log(LOG_LEVELS.ALERT, msg);
    return this;
  }

  public critical(msg: any): Logger {
    this.log(LOG_LEVELS.CRITICAL, msg);
    return this;
  }

  public error(msg: any): Logger {
    this.log(LOG_LEVELS.ERROR, msg);
    return this;
  }

  public warn(msg: any): Logger {
    this.log(LOG_LEVELS.WARN, msg);
    return this;
  }

  public notice(msg: any): Logger {
    this.log(LOG_LEVELS.NOTICE, msg);
    return this;
  }

  public info(msg: any): Logger {
    this.log(LOG_LEVELS.INFO, msg);
    return this;
  }

  public debug(msg: any): Logger {
    this.log(LOG_LEVELS.DEBUG, msg);
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

  private log(level: LOG_LEVELS, message: any) {
    return this.logger.log(
      Object.assign(
        {
          level,
          message,
        },
        this.opt,
      ),
    );
  }

  private fmt(): winston.Logform.Format {
    if (!this.formatter) {
      const fmtStack = [
        timestamp(),
        this.addServiceLabel(),
        this.createFormatter(),
      ];
      this.formatter = combine(...fmtStack);
    }
    return this.formatter;
  }

  private addServiceLabel(): winston.Logform.Format {
    return {
      transform: (info) => {
        if (this.opt.service) {
          info.svc = this.opt.service;
        }
        return info;
      },
    };
  }

  private createFormatter(): winston.Logform.Format {
    function toString(val: any): string {
      if (typeof val === 'string') {
        return val;
      }
      if (val && typeof val.toString === 'function') {
        return JSON.stringify(val);
      }
      return 'undefined';
    }

    return {
      transform: (info) => {
        const message = Object.keys(info)
          .sort()
          .map((key) => {
            return `${key}="${toString(info[key])}"`;
          })
          .filter((x) => x)
          .join(' ');
        info.message = message;
        info[MESSAGE] = message;
        return info;
      },
    };
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
  level:
    process.env.NODE_ENV === 'production' ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG,
});

export const fileTransport = new winston.transports.File({
  level:
    process.env.NODE_ENV === 'production' ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG,
  filename: join(process.cwd(), 'tmp', 'combined.log'),
});

export const logger = new Logger(
  winston.createLogger({
    level:
      process.env.NODE_ENV === 'production'
        ? LOG_LEVELS.ERROR
        : LOG_LEVELS.DEBUG,
    levels: winston.config.syslog.levels,
    transports: [consoleTransport, fileTransport],
  }),
);

export default logger;
