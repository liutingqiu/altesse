FROM node:20-alpine
WORKDIR /app
COPY . .
RUN mkdir -p /app/data
VOLUME /app/data
EXPOSE 3009
CMD ["node", "server.js"]
