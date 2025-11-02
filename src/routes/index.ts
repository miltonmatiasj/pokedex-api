import { Router } from "express";
import authRoutes from "./authRoutes";
import pokemonRoutes from "./pokemonRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/pokemons", pokemonRoutes);

router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Pokedex API is running" });
});

export default router;
