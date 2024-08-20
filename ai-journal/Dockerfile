# Dockerfile.spring
FROM docker.io/gradle:jdk21 as spring-build
WORKDIR /workspace/app
COPY . /workspace/app
RUN gradle bootJar

FROM docker.io/openjdk:21-jdk
VOLUME /tmp
ARG JAR_FILE=/workspace/app/build/libs/*.jar
COPY --from=spring-build ${JAR_FILE} app.jar
ENTRYPOINT ["java","-jar","/app.jar"]