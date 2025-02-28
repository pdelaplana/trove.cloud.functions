import { onRequest } from 'firebase-functions/v2/https';
import cors from 'cors';

export const about = onRequest({}, (request, response) => {
  cors({ origin: true })(request, response, () => {
    const info = {
      name: 'Trove',
      description: 'A loyalty card management app',
      features: ['Digital Wallet', 'Loyalty Rewards', 'Easy Redemption'],
    };

    // Send the JSON string as a response
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify(info));
  });
});
