const axios = require('axios');
const {
  MOBILE_RECOMMENDATIONS_CONTRACT,
  PROFILE_INCOMPLETE_RECOMMENDATION_MESSAGE,
} = require('../shared/constants/recommendations');

const gatewayBaseUrl = (process.env.KELMAH_PARITY_GATEWAY_URL || 'https://kelmah-api-gateway-gf3g.onrender.com').replace(/\/$/, '');
const email = process.env.KELMAH_PARITY_EMAIL;
const password = process.env.KELMAH_PARITY_PASSWORD;
const limit = String(process.env.KELMAH_PARITY_LIMIT || '2');

const fail = (message, details) => {
  console.error(message);
  if (details) {
    console.error(JSON.stringify(details, null, 2));
  }
  process.exit(1);
};

const main = async () => {
  if (!email || !password) {
    fail('Missing parity credentials. Set KELMAH_PARITY_EMAIL and KELMAH_PARITY_PASSWORD.');
  }

  const loginResponse = await axios.post(`${gatewayBaseUrl}/api/auth/login`, {
    email,
    password,
  });

  const token = loginResponse.data?.data?.token || loginResponse.data?.token;
  if (!token) {
    fail('Parity login succeeded but no access token was returned.', loginResponse.data);
  }

  const personalizedResponse = await axios.get(
    `${gatewayBaseUrl}/api/jobs/recommendations/personalized`,
    {
      params: { page: 1, limit },
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const payload = personalizedResponse.data || {};
  const meta = payload.meta || {};
  const data = payload.data || {};

  if (payload.success !== true) {
    fail('Personalized recommendations parity check failed: success=false.', payload);
  }

  if (meta.contract !== MOBILE_RECOMMENDATIONS_CONTRACT) {
    fail('Personalized recommendations contract drift detected.', {
      expected: MOBILE_RECOMMENDATIONS_CONTRACT,
      actual: meta.contract,
      payload,
    });
  }

  if (!Array.isArray(data.jobs)) {
    fail('Personalized recommendations payload drift: data.jobs is not an array.', payload);
  }

  if (meta.recommendationSource === 'profile-incomplete' && payload.message !== PROFILE_INCOMPLETE_RECOMMENDATION_MESSAGE) {
    fail('Profile-incomplete empty-state message drift detected.', {
      expected: PROFILE_INCOMPLETE_RECOMMENDATION_MESSAGE,
      actual: payload.message,
      payload,
    });
  }

  console.log('Personalized recommendations parity check passed.');
  console.log(JSON.stringify({
    gatewayBaseUrl,
    contract: meta.contract,
    recommendationSource: meta.recommendationSource || null,
    totalRecommendations: data.totalRecommendations ?? null,
  }, null, 2));
};

main().catch((error) => {
  fail('Personalized recommendations parity check crashed.', {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
  });
});