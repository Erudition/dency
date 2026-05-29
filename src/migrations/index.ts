import * as migration_20260522_212942 from './20260522_212942';
import * as migration_20260527_001517 from './20260527_001517';
import * as migration_20260527_010910_embed_cycle_config from './20260527_010910_embed_cycle_config';
import * as migration_20260529_221743_tenant_domains from './20260529_221743_tenant_domains';

export const migrations = [
  {
    up: migration_20260522_212942.up,
    down: migration_20260522_212942.down,
    name: '20260522_212942',
  },
  {
    up: migration_20260527_001517.up,
    down: migration_20260527_001517.down,
    name: '20260527_001517',
  },
  {
    up: migration_20260527_010910_embed_cycle_config.up,
    down: migration_20260527_010910_embed_cycle_config.down,
    name: '20260527_010910_embed_cycle_config',
  },
  {
    up: migration_20260529_221743_tenant_domains.up,
    down: migration_20260529_221743_tenant_domains.down,
    name: '20260529_221743_tenant_domains'
  },
];
