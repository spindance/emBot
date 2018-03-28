FROM node:carbon
WORKDIR /usr/src/app
EXPOSE 3000

COPY package*.json ./
RUN npm install --only=production

COPY dist dist
CMD [ "npm", "start" ]
