import Command, { flags } from '@oclif/command';
import Knex from 'knex';
import { cli } from 'cli-ux'

// dotenv for DB migrations that might inject
// env config via environment variables
import "ts-node/register";
import "dotenv";
import { loadConfig } from './_utils/load-config';

enum CMD {
  UP = 'up',
  DOWN = 'down',
  LIST = 'list',
  ROLLBACK = 'rollback',
  MAKE = 'make'
}

const defaultMigrationOpt = {
  extension: 'ts',
  loadExtensions: ['.ts'],
  directory: "./migrations",
  tableName: "_migrations",
  schemaName: null,
  disableTransactions: false
}

export class MigrateCommand extends Command {
  static description = 'migrate your db'

  static args = [
    {
      name: 'cmd',
      required: false,
      description: 'migration command to run',
      default: CMD.LIST,
      options: [CMD.LIST, CMD.MAKE, CMD.UP, CMD.DOWN, CMD.ROLLBACK],
    }
  ]

  static flags = {
    name: flags.string({
      description: 'name of the migration to run or make; required if making a migration'
    }),
    config: flags.string({
      description: 'path to a config file if not `app.json` in the current working directory',
      required: false,
    }),
  }

  async run() {
    const { args, flags } = this.parse(MigrateCommand);
    const { config } = loadConfig(flags.config);
    const knex = Knex(config.db);
    const opt = Object.assign({}, config.migrations, defaultMigrationOpt, {
      name: flags.name
    });

    switch (args.cmd) {
      case CMD.UP:
        await knex.migrate.up(opt);
        break;
      case CMD.DOWN:
        await knex.migrate.down(opt);
        break;
      case CMD.LIST:
        const list = await knex.migrate.list(opt);
        this.printTable(list);
        break;
      case CMD.ROLLBACK:
        await knex.migrate.rollback(opt);
        break;
      case CMD.MAKE:
        await knex.migrate.make(flags.name, opt);
        break;
    }

    this.exit(0);
  }

  private printTable(list: Array<Array<string>>) {
    const migrations = list.filter(([name]) => name).map(([name]) => ({ name }));
    cli.table(migrations, {
      name: {
        minWidth: 7,
      },
    }, {
      printLine: this.log,
    })
  }
}