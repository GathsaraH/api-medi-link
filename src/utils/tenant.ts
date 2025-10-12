import { randomUUID } from "crypto";
export const generateTenantCode = (organizationName: string): string => {
  const normalizedName = organizationName.toLowerCase().replace(/[^a-z0-9]/g, "");
  // .substring(0, 6);
  const uniqueId = randomUUID().substring(0, 6);
  return `${normalizedName}-${uniqueId}`;
};

export const generateSchemaName = (tenantCode: string): string => {
  return `${tenantCode.replace(/-/g, "_")}`;
};
