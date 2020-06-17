# Dependencies

client

server

vue
  → client

vue-cross-storage-client
  → client

vue-cross-storage-server
  → client
  → vue
    → client

## Publishing order

## client & server

npm version patch; npm publish access --public

## vue & vue-cross-storage-client

npm i -S @auth0-kits/client@latest; npm version patch; npm publish access --public

## vue-cross-storage-server

npm i -S @auth0-kits/client@latest @auth0-kits/vue@latest; npm version patch; npm publish access --public