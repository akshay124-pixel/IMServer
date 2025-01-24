const express = require("express");
const router = express.Router();
const stockController = require("../Controller/StocksLogic");

// Route to handle adding new stock
router.post("/add", stockController.addNewStock);
router.get("/stocks", stockController.getdata);
router.post("/out", stockController.outData);
router.get("/outstock", stockController.getOutData);
router.post("/bulk-upload", stockController.bulkUploadStocks);
router.put("/stock/:id", stockController.updateStock);
router.get("/export", stockController.exportStock);
router.get("/outexport", stockController.exportOutStock);
router.put("/update-out/:id", stockController.updateOutStock);
router.get("/production", stockController.getProductionStock);
router.get("/finished-goods", stockController.getfinshdata);
router.post("/outFinishedGoods", stockController.getOutFinshGood);
router.get("/fetchoutFinishedGoods", stockController.fetchOutFinshGood);
router.get(
  "/out-finished-goods-export",
  stockController.exportOutFinishedGoods
);
module.exports = router;
