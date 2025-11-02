import app from "./app";
import prisma from "./config/database";
import env from "./config/env";

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Conectado ao banco de dados MySQL");

    app.listen(env.PORT, () => {
      console.log(`Servidor rodando na porta ${env.PORT}`);
      console.log(`Acesse: http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar o servidor:", error);
    process.exit(1);
  }
}

async function shutdown() {
  console.log("\nEncerrando servidor...");
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();
