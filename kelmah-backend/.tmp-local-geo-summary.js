const WorkerController = require("./services/user-service/controllers/worker.controller");
const summarize = (label, payload) => {
  const items = payload?.data?.items || [];
  const distances = items.map((item) => item.distance).filter((value) => value !== null && value !== undefined);
  const maxDistance = distances.length ? Math.max(...distances) : null;
  console.log(`${label}_TOTAL=${payload?.data?.pagination?.total}`);
  console.log(`${label}_NON_NULL_DISTANCE=${distances.length}`);
  console.log(`${label}_MAX_DISTANCE=${maxDistance}`);
};
function createRes(label, done) {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { summarize(label, payload); done(); return this; },
  };
}
(async () => {
  await new Promise(async (resolve, reject) => {
    try {
      await WorkerController.getAllWorkers({ query: { page: '1', limit: '20' } }, createRes('LOCAL_BASE', resolve));
    } catch (error) { reject(error); }
  });
  await new Promise(async (resolve, reject) => {
    try {
      await WorkerController.getAllWorkers({ query: { latitude: '5.6037', longitude: '-0.187', radius: '10', page: '1', limit: '20', sortBy: 'distance' } }, createRes('LOCAL_GEO', resolve));
    } catch (error) { reject(error); }
  });
})().catch((err) => { console.error(err); process.exit(1); });
