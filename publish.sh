#!/bin/bash

npm test || exit 1
npm run build || exit 1

cp package.json ./dist
cp package-lock.json ./dist
cp LICENSE ./dist
cp readme.md ./dist
cp ./tsconfig.json ./dist

cd dist && npm publish