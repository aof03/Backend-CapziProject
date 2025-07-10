// backend/swagger/swaggerConfig.js

const swaggerJSDoc = require("swagger-jsdoc");

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Capzi API",
    version: "1.0.0",
    description: "API documentation for Capzi ride-hailing backend",
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Development server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: ["./routes/*.js"], // ดึง annotation Swagger จาก route ทุกไฟล์
};

module.exports = swaggerJSDoc(options);
 