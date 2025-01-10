FROM node:16-slim
WORKDIR /app
RUN apt-get update && apt-get install -y curl
COPY package*.json ./
RUN npm install
COPY . .
COPY .env.docker /app/.env
EXPOSE 3000
CMD ["npm", "start"]