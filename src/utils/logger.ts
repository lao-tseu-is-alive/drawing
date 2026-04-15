export enum LogLevel {
    TRACE = 0,
    DEBUG,
    INFO,
    WARN,
    ERROR
}

class Logger {
    level: LogLevel = LogLevel.TRACE;

    trace(msg: string, ...args: any[]) {
        if (this.level <= LogLevel.TRACE) {
            console.trace('%c TRACE ', 'background: #757575; color: white; border-radius: 2px; font-weight: bold;', msg, ...args);
        }
    }

    debug(msg: string, ...args: any[]) {
        if (this.level <= LogLevel.DEBUG) {
            console.debug('%c DEBUG ', 'background: #2196F3; color: white; border-radius: 2px; font-weight: bold;', msg, ...args);
        }
    }

    info(msg: string, ...args: any[]) {
        if (this.level <= LogLevel.INFO) {
            console.info('%c INFO  ', 'background: #4CAF50; color: white; border-radius: 2px; font-weight: bold;', msg, ...args);
        }
    }

    warn(msg: string, ...args: any[]) {
        if (this.level <= LogLevel.WARN) {
            console.warn('%c WARN  ', 'background: #FF9800; color: white; border-radius: 2px; font-weight: bold;', msg, ...args);
        }
    }

    error(msg: string, ...args: any[]) {
        if (this.level <= LogLevel.ERROR) {
            console.error('%c ERROR ', 'background: #F44336; color: white; border-radius: 2px; font-weight: bold;', msg, ...args);
        }
    }
}

export const log = new Logger();
