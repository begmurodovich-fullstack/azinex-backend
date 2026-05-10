import app from "./src/app.js";
import { config } from "./src/config.js";
import { setupWebhook } from "./src/services/telegramService.js";

app.listen(config.port, async () => {
  console.log(`Server running on port ${config.port}`);
  await setupWebhook();
});
