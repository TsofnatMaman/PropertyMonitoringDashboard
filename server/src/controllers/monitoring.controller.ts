import type { Request, Response } from "express";
import {
  startSyncProperty,
  startSyncAllProperties,
} from "../services/monitoring/sync.service";
import { getSyncAllProgress } from "../services/monitoring/sync-progress.service";
import { listCasesOverview } from "../services/monitoring/overview.service";
import { sendServerError } from "../utils/http";
import { listCasesFromDb } from "../services/cases/cases.service";

export async function syncPropertyCasesHandler(req: Request, res: Response) {
  try {
    const apn = String(req.params.apn || req.body?.apn || "").trim();

    if (!apn) {
      return res.status(400).json({
        ok: false,
        error: "APN is required",
      });
    }

    const result = await startSyncProperty(apn);

    return res.json({
      ok: true,
      ...result,
    });
  } catch (error: unknown) {
    return sendServerError(res, "Failed to sync property cases", error);
  }
}

export async function startSyncAllPropertiesHandler(
  _req: Request,
  res: Response
) {
  try {
    const result = await startSyncAllProperties();

    return res.json({
      ok: true,
      ...result,
    });
  } catch (error: unknown) {
    return sendServerError(res, "Failed to start sync for all properties", error);
  }
}

export function getSyncAllProgressHandler(_req: Request, res: Response) {
  try {
    return res.json({
      ok: true,
      ...getSyncAllProgress(),
    });
  } catch (error: unknown) {
    return sendServerError(res, "Failed to fetch sync progress", error);
  }
}

export function getAllCasesHandler(_req: Request, res: Response) {
  try {
    const cases = listCasesFromDb();

    return res.json({
      ok: true,
      cases,
    });
  } catch (error: unknown) {
    return sendServerError(res, "Failed to fetch cases", error);
  }
}

export function getCasesOverviewHandler(req: Request, res: Response) {
  try {
    const query = typeof req.query.query === "string" ? req.query.query : "";
    const openOnly = req.query.openOnly === "true";
    const attentionOnly = req.query.attentionOnly === "true";
    const urgentOnly = req.query.urgentOnly === "true";
    const newActivityOnly = req.query.newActivityOnly === "true";

    const limit = Math.min(
      Math.max(parseInt(String(req.query.limit || "20"), 10) || 20, 1),
      100
    );
    const offset = Math.max(
      parseInt(String(req.query.offset || "0"), 10) || 0,
      0
    );

    const result = listCasesOverview({
      query,
      openOnly,
      attentionOnly,
      urgentOnly,
      newActivityOnly,
      limit,
      offset,
    });

    return res.json({
      ok: true,
      filters: {
        query,
        openOnly,
        attentionOnly,
        urgentOnly,
        newActivityOnly,
      },
      pagination: {
        limit: result.pagination.limit,
        offset: result.pagination.offset,
        total: result.pagination.total,
        page: Math.floor(result.pagination.offset / result.pagination.limit) + 1,
        totalPages: Math.ceil(
          result.pagination.total / result.pagination.limit
        ),
        hasNextPage:
          result.pagination.offset + result.pagination.limit <
          result.pagination.total,
        hasPrevPage: result.pagination.offset > 0,
      },
      cases: result.cases,
      summary: result.summary,
    });
  } catch (error: unknown) {
    return sendServerError(res, "Failed to fetch cases overview", error);
  }
}