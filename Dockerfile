FROM nginx:stable-alpine
LABEL org.opencontainers.image.source="https://github.com/mcauzzi/PandaToolkit"
RUN rm -rf /usr/share/nginx/html/*
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
# Il contesto è già filtrato da .dockerignore: entrano solo la home, tools.json e le cartelle dei tool
COPY . /usr/share/nginx/html/
EXPOSE 80
