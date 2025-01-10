FROM node:16
WORKDIR /app
COPY ./package*.json ./
RUN yarn install
COPY . .
COPY .env.docker /app/.env
EXPOSE 3000
CMD ["yarn", "start"]