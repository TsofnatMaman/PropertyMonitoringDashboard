import { Router } from "express";
import {
  createPropertyHandler,
  getPropertiesHandler,
} from "../controllers/properties.controller";

const router = Router();

router.get("/", getPropertiesHandler);
router.post("/", createPropertyHandler);

export default router;