FROM node:16.19

COPY . /usr/local/ltac-api
WORKDIR /usr/local/ltac-api

RUN npm config set registry https://registry.npmmirror.com
RUN npm i --legacy-peer-deps
RUN npm run build

CMD ["npm", "run", "start:prod"]
