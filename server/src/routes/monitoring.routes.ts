import { Router } from "express";
import {
  syncPropertyCasesHandler,
  getAllCasesHandler,
  startSyncAllPropertiesHandler,
  getSyncAllProgressHandler,
  getCasesOverviewHandler,
} from "../controllers/monitoring.controller";

const router = Router();

router.post("/:apn/sync", syncPropertyCasesHandler);
router.post("/sync-all", startSyncAllPropertiesHandler);
router.get("/sync-all/progress", getSyncAllProgressHandler);
router.get("/cases/all", getAllCasesHandler);
router.get("/cases/overview", getCasesOverviewHandler);

export default router;