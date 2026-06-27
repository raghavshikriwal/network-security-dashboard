import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import threatsRouter from "./threats.js";
import incidentsRouter from "./incidents.js";
import ipLookupRouter from "./iplookup.js";
import statsRouter from "./stats.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(threatsRouter);
router.use(incidentsRouter);
router.use(ipLookupRouter);
router.use(statsRouter);

export default router;
