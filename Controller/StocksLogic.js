const Stock = require("../Schema/Stock");
const OutStock = require("../Schema/OutStock");
const FinishGood = require("../Schema/FinshGood");
const mongoose = require("mongoose");
const OutFinishedGoods = require("../Schema/OutFinishedGoods");
const XLSX = require("xlsx");
const addNewStock = async (req, res) => {
  try {
    // Destructuring data from the request body
    const {
      stockName,
      description,
      quantity,
      supplierName,
      category,
      pricePerUnit,
    } = req.body;

    // Input Validation: Check if all required fields are provided
    if (
      !stockName ||
      !description ||
      !quantity ||
      !supplierName ||
      !category ||
      !pricePerUnit
    ) {
      return res.status(400).json({ error: "All fields are required!" });
    }

    // Create a new Stock instance with the data, including the dateOfEntry
    const newStock = new Stock({
      stockName,
      description,
      quantity,
      supplierName,
      category,
      pricePerUnit,
      dateOfEntry: new Date(),
    });

    // Save the new stock to the database
    await newStock.save();

    // Respond with success message and the new stock
    return res
      .status(201)
      .json({ message: "Stock added successfully!", newStock });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error while adding stock" });
  }
};

// To Get Data From DataBase
const getdata = async (req, res) => {
  try {
    const stocks = await Stock.find();

    if (stocks.length === 0) {
      return res.status(404).json({ message: "No stock data found" });
    }

    res.status(200).json(stocks);
  } catch (err) {
    console.error("Error fetching stocks:", err);

    res
      .status(500)
      .json({ message: "Error fetching stock data. Please try again later." });
  }
};

// Controller function to process stock-out request
const outData = async (req, res) => {
  try {
    const {
      stockName,
      quantity,
      recipientName,
      purpose,
      dateOfIssue,
      targetTeam,
    } = req.body;

    // Ensure all necessary fields are provided
    if (!stockName || !quantity || !recipientName || !purpose || !dateOfIssue) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Find the stock item by name
    const stock = await Stock.findOne({ stockName });
    if (!stock) {
      return res.status(404).json({ message: "Stock not found." });
    }

    // Check if sufficient stock is available
    if (stock.quantity < quantity) {
      return res.status(400).json({ message: "Insufficient stock." });
    }

    // Update stock quantity
    stock.quantity -= quantity;
    await stock.save();

    // Create the out-stock record and link it to the stock
    const outStockRecord = new OutStock({
      stockName,
      quantity,
      recipientName,
      targetTeam,
      purpose,
      dateOfIssue,
      stockId: stock._id,
    });

    await outStockRecord.save();

    console.log("Stock-out details:", {
      stockName,
      quantity,
      recipientName,
      targetTeam,
      purpose,
      dateOfIssue,
    });

    res
      .status(200)
      .json({ message: "Stock issued successfully", stock: outStockRecord });
  } catch (error) {
    console.error("Error processing stock-out request:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};
const getOutData = async (req, res) => {
  try {
    const outStocks = await OutStock.find().populate(
      "stockId",
      "stockName category"
    );

    // Check if no out-stock data is found
    if (!outStocks || outStocks.length === 0) {
      return res.status(404).json({ message: "No out-stock data found" });
    }

    // Modify the structure to include the populated category field
    const result = outStocks.map((outStock) => ({
      ...outStock.toObject(),
      category: outStock.stockId ? outStock.stockId.category : "N/A",
      stockName: outStock.stockId ? outStock.stockId.stockName : "N/A",
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching out-stock data:", error);
    res.status(500).json({ message: "Error fetching out-stock data" });
  }
};

// Bulk Upload
const bulkUploadStocks = async (req, res) => {
  try {
    const newStocks = req.body; // Frontend sends an array of stocks

    if (!Array.isArray(newStocks) || newStocks.length === 0) {
      return res.status(400).json({ message: "Invalid data format." });
    }

    // Validate stocks
    const validatedStocks = newStocks.map((stock) => ({
      stockName: stock.stockName?.trim(),
      description: stock.description?.trim(),
      quantity: parseInt(stock.quantity, 10),
      supplierName: stock.supplierName?.trim(),
      category: stock.category?.trim(),
      pricePerUnit: parseFloat(stock.pricePerUnit),
      dateOfEntry: stock.dateOfEntry || new Date(),
    }));

    // Check for invalid stocks
    const invalidStocks = validatedStocks.filter(
      (stock) =>
        !stock.stockName ||
        !stock.description ||
        typeof stock.quantity !== "number" ||
        stock.quantity <= 0 ||
        !stock.supplierName ||
        !stock.category ||
        typeof stock.pricePerUnit !== "number" ||
        stock.pricePerUnit <= 0
    );

    if (invalidStocks.length > 0) {
      return res.status(400).json({
        message: "Some stocks have missing or invalid fields.",
        invalidStocks,
      });
    }

    // Insert validated stocks into the database
    await Stock.insertMany(validatedStocks);

    res.status(201).json({ message: "Stocks uploaded successfully!" });
  } catch (error) {
    console.error("Error in bulk upload:", error.message);
    res.status(500).json({ message: "Failed to upload stocks." });
  }
};

// Controller for updating a stock entry
const updateStock = async (req, res) => {
  const { quantity, description } = req.body; // Get updated values from the request body

  try {
    // Find the stock by ID and update it
    const stock = await Stock.findByIdAndUpdate(
      req.params.id, // The stock ID from the URL
      { quantity, description }, // The updated fields
      { new: true, runValidators: true } // 'new: true' ensures you return the updated document
    );

    // If the stock is not found
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    // Send the updated stock as a response
    res.status(200).json(stock);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating stock" });
  }
};

// Export
// Function to export stock data to CSV
const exportStock = async (req, res) => {
  try {
    // Fetch all stock entries from the database
    const stocks = await Stock.find();

    // Format the stock data as needed
    const formattedStocks = stocks.map((stock) => ({
      stockName: stock.stockName,
      description: stock.description,
      quantity: stock.quantity,
      supplierName: stock.supplierName,
      category: stock.category,
      pricePerUnit: stock.pricePerUnit,
      dateOfEntry: stock.dateOfEntry.toLocaleDateString(), // Format date if necessary
    }));

    // Convert the formatted data to a worksheet
    const ws = XLSX.utils.json_to_sheet(formattedStocks); // Convert JSON to worksheet

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Items");

    // Write the workbook to a Blob
    const fileBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    // Set response headers for downloading the XLSX file
    res.setHeader("Content-Disposition", "attachment; filename=stocks.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Send the XLSX file buffer in the response
    res.send(fileBuffer);
  } catch (error) {
    console.error("Error exporting stock:", error);
    res.status(500).send("Error exporting stock");
  }
};

// Function to export OutStock data to Xlsx
const exportOutStock = async (req, res) => {
  try {
    const outStocks = await OutStock.find()
      .populate("stockId", "stockName")
      .exec();

    const formattedOutStocks = outStocks.map((outStock) => ({
      stockName: outStock.stockId ? outStock.stockId.stockName : "N/A",
      quantity: outStock.quantity,
      recipientName: outStock.recipientName,
      purpose: outStock.purpose,
      dateOfIssue: outStock.dateOfIssue.toLocaleDateString(),
      dateOfEntry: outStock.dateOfEntry.toLocaleDateString(),
    }));

    // Convert the formatted data to a worksheet
    const ws = XLSX.utils.json_to_sheet(formattedOutStocks);

    // Create a workbook with the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Out Stock Data");

    // Set headers for download
    res.header(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.header(
      "Content-Disposition",
      "attachment; filename=outstock_items.xlsx"
    );

    // Write the workbook to a binary buffer and send the response
    const xlsxData = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
    res.send(xlsxData);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error exporting out-stock data");
  }
};
// Update OutStocks
const updateOutStock = async (req, res) => {
  try {
    const { quantity, remarks, assemblyStatus } = req.body;
    const stockId = req.params.id; // Get the stockId from the URL parameter

    // Check if stockId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(stockId)) {
      return res.status(400).json({ error: "Invalid stock ID" });
    }

    // Proceed with the update if the stockId is valid
    const updatedStock = await OutStock.findByIdAndUpdate(
      stockId,
      { quantity, remarks, assemblyStatus },
      { new: true }
    );

    if (!updatedStock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    return res.status(200).json(updatedStock);
  } catch (error) {
    console.error("Error updating stock:", error);
    return res.status(500).json({ error: "Failed to update stock" });
  }
};

// Fetch out-of-stock items for production team
const getProductionStock = async (req, res) => {
  try {
    // Fetch the out-of-stock items for production and populate stockName
    const productionStock = await OutStock.find({
      targetTeam: "Production",
      assemblyStatus: { $ne: "Assembled" }, // Exclude items with assemblyStatus "Assembled"
    }).populate("stockId", "stockName"); // Assuming stockId references the Stocks collection

    if (productionStock.length === 0) {
      return res.status(404).json({ message: "No production stock found" });
    }

    res.json(productionStock);
  } catch (error) {
    console.error("Error fetching production stock:", error);
    res.status(500).json({ message: "Error fetching data. Please try again." });
  }
};

// logic
const getfinshdata = async (req, res) => {
  try {
    const finishedGoods = await FinishGood.find();

    if (finishedGoods.length === 0) {
      return res.status(404).json({ message: "No finished goods data found" });
    }

    res.status(200).json(finishedGoods);
  } catch (err) {
    console.error("Error fetching finished goods:", err);

    res.status(500).json({
      message: "Error fetching finished goods data. Please try again later.",
    });
  }
};
// OutFinshGood
const getOutFinshGood = async (req, res) => {
  const { productName, quantity, address, price, recipientName, dateOfIssue } =
    req.body;

  try {
    const newOutFinishedGood = new OutFinishedGoods({
      productName,
      quantity,
      address,
      price,
      recipientName,
      dateOfIssue,
    });

    await newOutFinishedGood.save();

    // Deduct quantity from FinishedGoods
    await FinishGood.findOneAndUpdate(
      { productName },
      { $inc: { quantity: -quantity } }
    );

    res
      .status(201)
      .json({ message: "OutFinishedGoods data saved successfully" });
  } catch (error) {
    console.error("Error saving outFinishedGoods data:", error);
    res.status(500).json({ message: "Failed to save data", error });
  }
};
// Get Out Finsh Good
const fetchOutFinshGood = async (req, res) => {
  try {
    const outFinishedGoods = await OutFinishedGoods.find();

    if (outFinishedGoods.length === 0) {
      return res.status(404).json({ message: "No out finished goods found" });
    }

    res.status(200).json(outFinishedGoods);
  } catch (error) {
    console.error("Error fetching out finished goods:", error);
    res.status(500).json({ message: "Error fetching out finished goods" });
  }
};
// Function to export OutFinishedGoods data to Xlsx
const exportOutFinishedGoods = async (req, res) => {
  try {
    const outFinishedGoods = await OutFinishedGoods.find()
      .populate("productId", "productName")
      .exec();

    const formattedOutFinishedGoods = outFinishedGoods.map(
      (outFinishedGood) => ({
        ProductName: outFinishedGood.productName,
        Quantity: outFinishedGood.quantity,
        RecipientName: outFinishedGood.recipientName,
        Address: outFinishedGood.address,
        Price: outFinishedGood.price,
        DateOfIssue: outFinishedGood.dateOfIssue
          ? outFinishedGood.dateOfIssue.toLocaleDateString()
          : "N/A",
      })
    );

    const ws = XLSX.utils.json_to_sheet(formattedOutFinishedGoods);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Out Finished Goods Data");

    res.header(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.header(
      "Content-Disposition",
      "attachment; filename=outfinishedgoods.xlsx"
    );

    const xlsxData = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
    res.send(xlsxData);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error exporting out-finished goods data");
  }
};

module.exports = {
  getfinshdata,
  fetchOutFinshGood,
  getOutFinshGood,
  exportOutFinishedGoods,
  getProductionStock,
  addNewStock,
  getdata,
  outData,
  getOutData,
  bulkUploadStocks,
  updateStock,
  updateOutStock,
  exportStock,
  exportOutStock,
};
