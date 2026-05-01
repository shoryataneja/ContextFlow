const router = require('express').Router();
const ctrl = require('../controllers/context.controller');
const { uploadSingle } = require('../middleware/upload');

router.get('/stats', ctrl.getStats);
router.get('/analyze', ctrl.analyzeContexts);
router.get('/retrieve', ctrl.retrieveContexts);
router.get('/explain/:id', ctrl.explainContext);
router.get('/:id', ctrl.getContext);
router.get('/', ctrl.listContexts);
router.post('/', uploadSingle, ctrl.addContext);
router.put('/:id', uploadSingle, ctrl.updateContext);
router.delete('/:id', ctrl.deleteContext);

module.exports = router;
