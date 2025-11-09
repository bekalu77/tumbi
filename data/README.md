This folder stores runtime data for the application.

Structure:
- database.sqlite  - SQLite database used by the server
- uploads/         - uploaded images and files
- icons/           - small icons and avatars

Migration:
To move existing uploaded files from the old `server/uploads` folder into `data/uploads` run:

  node --loader ts-node/esm server/scripts/migrate-uploads.ts

(On Windows PowerShell you may run: `node --loader ts-node/esm server/scripts/migrate-uploads.ts` if `ts-node` is installed)

Note: The script preserves filenames, so existing references such as `/api/uploads/product-...` will continue to work.
