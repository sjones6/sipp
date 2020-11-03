import Command from '@oclif/command';

export class MigrateCommand extends Command {
  static description = 'migrate your db'

  async run() {
    this.log('running my command');
    this.exit(0);
  }
}