const swaggerJSDoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Forkooor",
            version: "0.0.1",
            description: "Forked from defisaver-v3-contracts repo for easier access to tenderly fork testing"
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Development server"
            }
        ]
    },
    apis: ["src/routers/**/*.js"]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
