FROM nginx:stable-alpine
LABEL org.opencontainers.image.source="https://github.com/mcauzzi/PandaToolkit"
RUN rm -rf /usr/share/nginx/html/*
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
# Il contesto è già filtrato da .dockerignore: entrano la home, tools.json e le cartelle dei tool,
# più deploy/nginx.conf che serve sopra e qui va tolto dalla web root
COPY . /usr/share/nginx/html/
RUN rm -rf /usr/share/nginx/html/deploy
EXPOSE 80
