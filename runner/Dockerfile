FROM eclipse-temurin:21-jdk-jammy
RUN apt-get update && apt-get install -y --no-install-recommends procps && rm -rf /var/lib/apt/lists/*
ENV HOME=/workspace
WORKDIR /workspace
USER 1000:1000
CMD ["sleep", "infinity"]
