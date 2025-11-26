import { Request, Response } from "express";
import prisma from "../config/database";

class PokemonController {
  async index(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const pokemons = await prisma.pokemon.findMany({
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          tipo: true,
          habilidades: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json(pokemons);
    } catch (error) {
      console.error("Erro ao buscar pokémons:", error);
      res.status(500).json({ error: "Erro ao buscar pokémons" });
    }
  }

  async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const pokemon = await prisma.pokemon.findFirst({
        where: {
          id: parseInt(id)
        },
        select: {
          id: true,
          name: true,
          tipo: true,
          habilidades: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!pokemon) {
        res.status(404).json({ error: "Pokémon não encontrado" });
        return;
      }

      res.json(pokemon);
    } catch (error) {
      console.error("Erro ao buscar pokémon:", error);
      res.status(500).json({ error: "Erro ao buscar pokémon" });
    }
  }

  async search(req: Request, res: Response): Promise<void> {
  try {
    const { name, tipo, habilidade } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];

    // name LIKE
    if (name && typeof name === "string") {
      conditions.push(`name LIKE ?`);
      params.push(`%${name}%`);
    }

    // tipo LIKE
    if (tipo && typeof tipo === "string") {
      conditions.push(`tipo LIKE ?`);
      params.push(`%${tipo}%`);
    }

    // habilidade dentro do JSON array -> JSON_SEARCH suporta wildcard '%'
    if (habilidade && typeof habilidade === "string") {
      // se 'habilidades' for JSON no MySQL:
      conditions.push(`JSON_UNQUOTE(JSON_EXTRACT(habilidades, '$')) COLLATE utf8mb4_general_ci LIKE ?`);
      params.push(`%${habilidade}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT id, name, tipo, habilidades, createdAt, updatedAt
      FROM pokemons
      ${whereClause}
      ORDER BY name ASC
    `;

    const pokemons = await prisma.$queryRawUnsafe(query, ...params);

    res.json(pokemons);
  } catch (error) {
    console.error("Erro ao buscar pokémons:", error);
    res.status(500).json({ error: "Erro ao buscar pokémons" });
  }
}



  async dashboard(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const totalCount = await prisma.pokemon.count({
      });

      const pokemons = await prisma.pokemon.findMany({
        select: {
          tipo: true,
          habilidades: true,
        },
      });

      const typeCounts = new Map<string, number>();
      pokemons.forEach((pokemon) => {
        const tipo = pokemon.tipo;
        typeCounts.set(tipo, (typeCounts.get(tipo) || 0) + 1);
      });

      const abilityCounts = new Map<string, number>();
      pokemons.forEach((pokemon) => {
        const habilidades = pokemon.habilidades as string[];
        habilidades.forEach((habilidade) => {
          abilityCounts.set(
            habilidade,
            (abilityCounts.get(habilidade) || 0) + 1
          );
        });
      });

      const topTypes = Array.from(typeCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tipo, count]) => ({ tipo, count }));

      const topAbilities = Array.from(abilityCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([habilidade, count]) => ({ habilidade, count }));

      res.json({
        totalPokemons: totalCount,
        topTipos: topTypes,
        topHabilidades: topAbilities,
      });
    } catch (error) {
      console.error("Erro ao buscar dashboard:", error);
      res.status(500).json({ error: "Erro ao buscar dashboard" });
    }
  }

  async store(req: Request, res: Response): Promise<void> {
    try {
      const { name, tipo, habilidades } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!name || !tipo || !habilidades) {
        res.status(400).json({
          error: "Nome, tipo e habilidades são obrigatórios",
        });
        return;
      }

      if (typeof tipo !== "string" || tipo.trim() === "") {
        res.status(400).json({
          error: "Tipo deve ser uma string não vazia",
        });
        return;
      }

      if (!Array.isArray(habilidades)) {
        res.status(400).json({
          error: "Habilidades deve ser um array",
        });
        return;
      }

      if (habilidades.length < 1 || habilidades.length > 3) {
        res.status(400).json({
          error: "Pokémon deve ter entre 1 e 3 habilidades",
        });
        return;
      }

      if (!habilidades.every((h) => typeof h === "string" && h.trim() !== "")) {
        res.status(400).json({
          error: "Todas as habilidades devem ser strings não vazias",
        });
        return;
      }

      const existingPokemon = await prisma.pokemon.findFirst({
        where: {
          name
        },
      });

      if (existingPokemon) {
        res.status(409).json({
          error: "Pokemon já cadastrado no sistema.",
        });
        return;
      }

      const pokemon = await prisma.pokemon.create({
        data: {
          name,
          tipo: tipo.trim(),
          habilidades: habilidades.map((h: string) => h.trim()),
          userId,
        },
        select: {
          id: true,
          name: true,
          tipo: true,
          habilidades: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.status(201).json(pokemon);
    } catch (error) {
      console.error("Erro ao criar pokémon:", error);
      res.status(500).json({ error: "Erro ao criar pokémon" });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, tipo, habilidades } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const existingPokemon = await prisma.pokemon.findFirst({
        where: {
          id: parseInt(id)
        },
      });

      if (!existingPokemon) {
        res.status(404).json({
          error:
            "Pokémon não encontrado ou você não tem permissão para editá-lo",
        });
        return;
      }

      if (tipo !== undefined) {
        if (typeof tipo !== "string" || tipo.trim() === "") {
          res.status(400).json({
            error: "Tipo deve ser uma string não vazia",
          });
          return;
        }
      }

      if (habilidades !== undefined) {
        if (!Array.isArray(habilidades)) {
          res.status(400).json({
            error: "Habilidades deve ser um array",
          });
          return;
        }

        if (habilidades.length < 1 || habilidades.length > 3) {
          res.status(400).json({
            error: "Pokémon deve ter entre 1 e 3 habilidades",
          });
          return;
        }

        if (
          !habilidades.every((h) => typeof h === "string" && h.trim() !== "")
        ) {
          res.status(400).json({
            error: "Todas as habilidades devem ser strings não vazias",
          });
          return;
        }
      }

      if (name && name !== existingPokemon.name) {
        const pokemonWithName = await prisma.pokemon.findFirst({
          where: {
            name,
            id: { not: parseInt(id) },
          },
        });

        if (pokemonWithName) {
          res.status(409).json({
            error: "Você já possui outro pokémon com este nome",
          });
          return;
        }
      }

      const pokemon = await prisma.pokemon.update({
        where: { id: parseInt(id) },
        data: {
          ...(name && { name }),
          ...(tipo && { tipo: tipo.trim() }),
          ...(habilidades && {
            habilidades: habilidades.map((h: string) => h.trim()),
          }),
        },
        select: {
          id: true,
          name: true,
          tipo: true,
          habilidades: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json(pokemon);
    } catch (error) {
      console.error("Erro ao atualizar pokémon:", error);
      res.status(500).json({ error: "Erro ao atualizar pokémon" });
    }
  }

  async destroy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const pokemon = await prisma.pokemon.findFirst({
        where: {
          id: parseInt(id)
        },
      });

      if (!pokemon) {
        res.status(404).json({
          error:
            "Pokémon não encontrado ou você não tem permissão para deletá-lo",
        });
        return;
      }

      await prisma.pokemon.delete({
        where: { id: parseInt(id) },
      });

      res.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar pokémon:", error);
      res.status(500).json({ error: "Erro ao deletar pokémon" });
    }
  }
}

export default new PokemonController();
