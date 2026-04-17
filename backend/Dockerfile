FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY pom.xml .
COPY .mvn .mvn
COPY mvnw mvnw
COPY mvnw.cmd mvnw.cmd

RUN chmod +x mvnw

RUN ./mvnw dependency:go-offline -B

COPY src ./src

RUN ./mvnw clean package -DskipTests

EXPOSE 8080

CMD ["java", "-jar", "target/trailbuddy-backend-1.0.0.jar"]