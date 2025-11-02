import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import routes from "./routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", routes);

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Bem-vindo à Pokedex API!",
    version: "2.0.0",
    endpoints: {
      health: "/api/health",
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        me: "GET /api/auth/me (protegida)",
      },
      pokemons: {
        list: "GET /api/pokemons (protegida)",
        getById: "GET /api/pokemons/:id (protegida)",
        getByNumber: "GET /api/pokemons/number/:number (protegida)",
        create: "POST /api/pokemons (protegida)",
        update: "PUT /api/pokemons/:id (protegida)",
        delete: "DELETE /api/pokemons/:id (protegida)",
      },
    },
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Algo deu errado!" });
});

export default app;
