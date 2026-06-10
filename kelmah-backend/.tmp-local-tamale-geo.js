const WorkerController = require("./services/user-service/controllers/worker.controller");
function createRes(label, done) {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) {
      const items = payload?.data?.items || [];
      const distances = items.map((item) => item.distance).filter((value) => value !== null && value !== undefined);
      const maxDistance = distances.length ? Math.max(...distances) : null;
      console.log(`${label}_TOTAL=${payload?.data?.pagination?.total}`);
      console.log(`${label}_NON_NULL_DISTANCE=${distances.length}`);
      console.log(`${label}_MAX_DISTANCE=${maxDistance}`);
      done();
      return this;
    },
  };
}
(async () => {
  await new Promise(async (resolve, reject) => {
    try {
      await WorkerController.getAllWorkers({ query: { latitude: '9.4034', longitude: '-0.8424', radius: '10', page: '1', limit: '20', sortBy: 'distance' } }, createRes('LOCAL_TAMALE_GEO', resolve));
    } catch (error) { reject(error); }
  });
})().catch((err) => { console.error(err); process.exit(1); });
