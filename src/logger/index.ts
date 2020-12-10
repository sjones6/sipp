import winston, { format } from 'winston';
import { join } from 'path';
import { MESSAGE } from 'triple-beam';
import { getStore, hasStore } from '../utils/async-store';
const { combine, timestamp, colorize, errors, printf } = format;

const STORAGE_KEY = 'logger-storage-key';

export interface LoggerOpt {
  service: string | false;
}

const defaultOptions: LoggerOpt = {
  service: 'sipp',
};

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

export type LOGGER_MODE = 'development' | 'production' | string;

function toString(val: any): string {
  if (typeof val === 'string') {
    return val;
  }
  if (val && typeof val.toString === 'function') {
    return JSON.stringify(val);
  }
  return 'undefined';
}

export class Logger {
  private formatter: winston.Logform.Format;
  constructor(
    private readonly mode: LOGGER_MODE,
    private readonly logger: winston.Logger,
    private readonly opt: LoggerOpt = defaultOptions,
  ) {
    this.logger.format = this.fmt();
  }

  static new(mode?: LOGGER_MODE): Logger {
    const prodMode = mode === 'production';
    return new Logger(
      mode,
      winston.createLogger({
        level: prodMode ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO,
        levels: winston.config.syslog.levels,
        transports: prodMode ? [consoleTransport, fileTransport] : [consoleTransport],
      }),
    );
  }

  /**
   * @param scoping key=value pairs to add to the logger's scope when logging messages
   * @param force if true, it will overwrite any existing scopted values
   */
  addScope(scoping: object, force?: boolean): void {
    const store = getStore();
    if (store) {
      const currentScope = store.get(STORAGE_KEY) || {};
      Object.keys(scoping).forEach((key) => {
        if (!{}.hasOwnProperty.call(this.opt, key) || force) {
          currentScope[key] = scoping[key];
        }
      });
      store.set(STORAGE_KEY, currentScope);
    } else {
      this.warn('addScope called outside of async/req context');
    }
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
    const store = hasStore() ? getStore() : null;
    return this.logger.log(
      Object.assign(
        {
          level,
          message,
        },
        store ? store.get(STORAGE_KEY) : {},
      ),
    );
  }

  private fmt(): winston.Logform.Format {
    if (!this.formatter) {
      this.formatter = this.mode === 'production' ? this.productionFormatter() : this.developmentFormatter();
    }
    return this.formatter;
  }

  private productionFormatter(): winston.Logform.Format {
    return combine(
      timestamp(),
      this.addServiceLabel(),
      this.createMachineParseableFormatter()
    );
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

  private developmentFormatter(): winston.Logform.Format {
    return combine(
      timestamp(),
      colorize(),
      this.addServiceLabel(),
      errors(),
      printf((info) => {
        const { level, svc, message, ...rest } = info; 
        return `${level}${svc ? ` (${svc})` : ''}: ${message}`;
      })
    );
  }

  private createMachineParseableFormatter(): winston.Logform.Format {
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
