import { Migrate } from "./app/presentes.usecase";
import { StartServer } from "./http/server";
import { CheckDatabaseConnection } from "@/src/infra/db/index";

(async () => {
  const dbIsRunning = await CheckDatabaseConnection();
  if (dbIsRunning) {
    // await Migrate()
    StartServer(3333);
  }
})();
