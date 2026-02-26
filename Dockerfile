FROM node:18-alpine
WORKDIR /app
COPY package*.json ./

RUN npm config set registry https://mw-npm-repository.mathworks.com/artifactory/api/npm/npm-repos
RUN npm install

COPY . .
EXPOSE 3000

CMD ["npm", "start"]