FROM node:20-alpine

WORKDIR /app

# install deps
COPY package*.json ./
RUN npm install

# copy code
COPY . .

ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["npm", "run", "dev"]