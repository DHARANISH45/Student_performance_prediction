FROM node:18-slim
WORKDIR /app
COPY . /app
RUN npm install --no-cache --silent
RUN npm run build
EXPOSE 3000
CMD ["npx", "serve", "-s", "build", "-l", "3000"]
