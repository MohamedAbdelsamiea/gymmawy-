import app from "./app.js";
import { initializeSubscriptionService } from "./services/subscriptionService.js"; // Start subscription service

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Gymmawy API listening on :${port}`);
});


