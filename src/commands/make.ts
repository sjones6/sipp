import Command from '@oclif/command';
import { join } from 'path';

export class MakeCommand extends Command {
  static description = 'generate various code elements'

  async run() {
    
    this.log();
    this.exit(0);
  }
}