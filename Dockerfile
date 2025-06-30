FROM node:latest

WORKDIR /home/choreouser

EXPOSE 8080

COPY index.js package.json /home/choreouser/

RUN apt-get update &&\
    apt-get install -y iproute2 vim netcat-openbsd &&\
    addgroup --gid 10001 choreo &&\
    adduser --disabled-password  --no-create-home --uid 10001 --ingroup choreo choreouser &&\
    usermod -aG sudo choreouser &&\
    chmod +x index.js &&\
    npm install -r package.json

CMD [ "node", "index.js" ]

USER 10001
