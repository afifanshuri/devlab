FROM maven:3.9.9-eclipse-temurin-21 AS spring
WORKDIR /build
COPY runner/spring-pom.xml pom.xml
RUN mvn -B -q org.apache.maven.plugins:maven-dependency-plugin:3.8.1:copy-dependencies -DincludeScope=test -DoutputDirectory=/opt/spring/lib

FROM eclipse-temurin:21-jdk-jammy
COPY --from=spring /opt/spring/lib /opt/spring/lib
RUN apt-get update && apt-get install -y --no-install-recommends procps && rm -rf /var/lib/apt/lists/*
ENV HOME=/workspace
ENV CLASSPATH=/opt/spring/lib/*:.
WORKDIR /workspace
USER 1000:1000
CMD ["sleep", "infinity"]
