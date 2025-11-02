import { Router } from "express";
import pokemonController from "../controllers/pokemonController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.get("/dashboard", pokemonController.dashboard);
router.get("/search", pokemonController.search);

router.get("/", pokemonController.index);
router.get("/:id", pokemonController.show);
router.post("/", pokemonController.store);
router.put("/:id", pokemonController.update);
router.delete("/:id", pokemonController.destroy);

export default router;
