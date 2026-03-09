const WorkerController = require("./services/user-service/controllers/worker.controller");
function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; console.log(JSON.stringify({ statusCode: this.statusCode, payload }, null, 2)); return this; }
  };
}
(async () => {
  const req = { query: { latitude: '5.6037', longitude: '-0.187', radius: '10', page: '1', limit: '20', sortBy: 'distance' } };
  const res = createRes();
  await WorkerController.getAllWorkers(req, res);
})().catch((err) => { console.error(err); process.exit(1); });
