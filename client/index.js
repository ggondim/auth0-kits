export { default as Auth0Service } from './src/Auth0Service';

import { default as Scopes } from './src/scopes';
import { default as StorageKeys } from './src/storage-keys';
import { default as Events } from './src/events';
import { default as CrossStorageCommands } from './src/cross-storage-commands';

export const Defaults = { Scopes, StorageKeys, Events, CrossStorageCommands };
