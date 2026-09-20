import express, {
  type Express,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const requestLogger: RequestHandler = pinoHttp<Request, Response>({
  logger,
  serializers: {
    req(req: Request) {
      return {
        id: req.id,
        method: req.method,
        url: req.url?.split("?")[0],
      };
    },
    res(res: Response) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
}) as RequestHandler;

app.use(
  requestLogger,
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
