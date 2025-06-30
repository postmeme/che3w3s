FROM node:latest

EXPOSE 8080

WORKDIR /app

COPY . .

RUN apt update -y &&\
    chmod +x index.js &&\
    npm install 

CMD ["npm", "start"]
