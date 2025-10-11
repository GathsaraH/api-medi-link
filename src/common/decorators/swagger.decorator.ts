import { applyDecorators } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiConsumes, ApiQuery, ApiParam, ApiBody } from "@nestjs/swagger";

export const ApiEndpoint = (
  summary: string,
  options?: {
    okResponse?: string;
    consumes?: string;
    badRequestMessage?: string;
    queryParams?: { name: string; description: string; required?: boolean; type?: any; enum?: any[] }[];
    pathParams?: { name: string; description: string; required?: boolean; type?: any }[];
    body?: { description: string; type: any };
    formData?: { name: string; description: string; required?: boolean; type?: string; items?: any }[];
  },
) => {
  const decorators = [
    ApiOperation({ summary }),
    ApiResponse({
      status: 200,
      description: options?.okResponse || "Operation successful",
    }),
    ApiResponse({
      status: 400,
      description: options?.badRequestMessage || "Bad request",
      schema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            example: "error",
          },
          error: {
            type: "array",
            example: [],
          },
        },
      },
    }),
  ];

  if (options?.consumes) {
    decorators.push(ApiConsumes(options.consumes));
  }

  if (options?.queryParams) {
    options.queryParams.forEach(param => {
      decorators.push(
        ApiQuery({
          name: param.name,
          description: param.description,
          required: param.required,
          type: param.type,
          enum: param.enum,
        }),
      );
    });
  }

  if (options?.pathParams) {
    options.pathParams.forEach(param => {
      decorators.push(ApiParam(param));
    });
  }

  if (options?.body) {
    decorators.push(
      ApiBody({
        description: options.body.description,
        type: options.body.type,
      }),
    );
  }

  if (options?.formData) {
    options.formData.forEach(field => {
      decorators.push(
        ApiBody({
          description: field.description,
          required: field.required,
          schema: {
            type: "object",
            properties: {
              [field.name]: {
                type: field.type,
                ...(field.items ? { items: field.items } : {}),
              },
            },
          },
        }),
      );
    });
  }

  return applyDecorators(...decorators);
};
