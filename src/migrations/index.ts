import * as migration_20260522_212942 from './20260522_212942';
import * as migration_20260527_001517 from './20260527_001517';

export const migrations = [
  {
    up: migration_20260522_212942.up,
    down: migration_20260522_212942.down,
    name: '20260522_212942',
  },
  {
    up: migration_20260527_001517.up,
    down: migration_20260527_001517.down,
    name: '20260527_001517'
  },
];
