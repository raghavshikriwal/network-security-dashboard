import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { trafficStore } from "./lib/trafficStore.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  path: "/api/socket.io",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "Socket.io client connected");

  // Send last 30 traffic points on connect
  const history = trafficStore.getHistory(30);
  socket.emit("traffic_history", history);

  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, "Socket.io client disconnected");
  });
});

// Emit traffic updates every 5 seconds
setInterval(() => {
  const point = trafficStore.addPoint();
  io.emit("traffic_update", point);

  // Occasionally emit a random threat alert
  if (Math.random() < 0.15) {
    const severities = ["critical", "high", "medium", "low"];
    const types = ["port_scan", "brute_force", "ddos", "sql_injection", "xss", "malware"];
    io.emit("new_threat", {
      id: Date.now(),
      title: `${types[Math.floor(Math.random() * types.length)]?.replace("_", " ").toUpperCase()} detected`,
      severity: severities[Math.floor(Math.random() * severities.length)],
      sourceIp: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      timestamp: new Date().toISOString(),
    });
  }
}, 5000);

export { httpServer };
export default app;
