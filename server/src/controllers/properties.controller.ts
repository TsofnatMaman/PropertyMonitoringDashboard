import { Request, Response } from "express";
import { createProperty, listProperties } from "../services/properties/properties.service";
import { sendServerError } from "../utils/http";
import { isValidApn } from "../utils/validation";
import { logger } from "../services/system/logger.service";

export function getPropertiesHandler(_req: Request, res: Response) {
  try {
    const properties = listProperties();
    return res.json({
      ok: true,
      properties,
    });
  } catch (error: unknown) {
    return sendServerError(res, "Failed to fetch properties", error);
  }
}

export async function createPropertyHandler(req: Request, res: Response) {
  try {
    const { apn, description } = req.body;

    if (!isValidApn(apn)) {
      return res.status(400).json({ error: "Invalid APN" });
    }

    const normalizedApn = String(apn).trim();
    const normalizedDescription = description ? String(description).trim() : null;

    const created = createProperty(normalizedApn, normalizedDescription);

    logger.info(created.isNew ? "Property created" : "Property updated", {
      apn: normalizedApn,
      description: normalizedDescription,
    });

    return res.json({
      ok: true,
      property: created.property,
      isNew: created.isNew,
    });
  } catch (error: unknown) {
    return sendServerError(res, "Failed to save property", error);
  }
}
