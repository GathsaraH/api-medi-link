import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// swagger
export const buildSwagger = (app) => {
  const config = new DocumentBuilder()
    .setTitle('MediLink API')
    .setDescription('This is the API for the MediLink Product')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'bearer',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-tenant-code',
        description: 'Tenant code tenant-specific data',
      },
      'tenant-code',
    )

    .addSecurity('bearer', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });

  config.addServer(
    process.env.BACKEND_DOMAIN,
    process.env.NODE_ENV === 'development' ? 'Development' : 'Production',
  );

  const document = SwaggerModule.createDocument(app, config.build());

  // Apply bearer auth globally to all endpoints
  document.security = [{ bearer: [] }];

  return document;
};

export const setupSwagger = (app) => {
  const document = buildSwagger(app);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
};
