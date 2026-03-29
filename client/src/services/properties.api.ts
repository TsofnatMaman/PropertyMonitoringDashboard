import { api } from "./api";
import type { CreatePropertyInput, Property } from "../types/property";

type GetPropertiesResponse = {
  ok: true;
  properties: Property[];
};

type CreatePropertyResponse = {
  ok: true;
  property: Property;
  isNew?: boolean;
};

export async function getProperties(): Promise<Property[]> {
  const data = await api.get<GetPropertiesResponse>("/api/properties");
  return data.properties || [];
}

export async function createProperty(
  input: CreatePropertyInput
): Promise<Property> {
  const data = await api.post<CreatePropertyResponse>("/api/properties", input);
  return data.property;
}