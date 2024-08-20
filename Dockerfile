# Build the Spring Boot application
FROM gradle:jdk21 as spring-build
WORKDIR /workspace/app
COPY ./ai-journal /workspace/app
RUN gradle bootJar

# Build the React application
FROM node:20 as react-build
WORKDIR /app
COPY ./ai-journal-app /app
RUN npm install
RUN npm run build

# Copy the built React application into the static resources directory of the Spring Boot application
FROM spring-build as final-build
COPY --from=react-build /app/build /workspace/app/src/main/resources/static

# Build the final Docker image
FROM openjdk:21-jdk
VOLUME /tmp
ARG JAR_FILE=/workspace/app/build/libs/*.jar
COPY --from=final-build ${JAR_FILE} app.jar
ENTRYPOINT ["java","-jar","/app.jar"]