# Dockerfile.react
FROM docker.io/node:20 as build
WORKDIR /app
COPY package.json package-lock.json ./
# Define the variable with the ARG instruction
ARG REACT_APP_JOURNAL_BFF_BASE_URL
# Set the variable as an environment variable with the ENV instruction
ENV REACT_APP_JOURNAL_BFF_BASE_URL=$REACT_APP_JOURNAL_BFF_BASE_URL
RUN npm install
COPY . ./
RUN npm run build

#FROM nginx:1.21.1-alpine
#COPY --from=build /app/build /usr/share/nginx/html
# Use Node.js image for the runtime stage
FROM node:20
WORKDIR /app
COPY --from=build /app/build ./build

# Install serve
RUN npm install -g serve

# Start the server
CMD ["serve", "-s", "build","-l", "3090"]