const mongoose = require("mongoose");

// Assuming `FinishGood` model is in the same directory
const FinishGood = require("./FinshGood"); // Adjust the path as necessary

const outStockSchema = new mongoose.Schema({
  stockName: {
    type: String,
    required: true,
    trim: true,
  },
  stockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stock", // This references the Stock model
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  targetTeam: {
    type: String,
    enum: ["Production", "Individual"],
    required: true,
  },
  recipientName: {
    type: String,
    required: true,
    trim: true,
  },
  purpose: {
    type: String,
    required: true,
    trim: true,
  },
  dateOfIssue: {
    type: Date,
    required: true,
  },
  dateOfEntry: {
    type: Date,
    default: Date.now,
  },
  assemblyStatus: {
    type: String,
    enum: ["Assembled", "Used", "In Stock", "Not Assembled"],
    default: "In Stock",
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: 500,
  },
});

// Model for OutStock
const OutStock = mongoose.model("OutStock", outStockSchema);
// Function to check and create finished goods
const checkAndCreateFinishedGoods = async () => {
  try {
    const assembledParts = await OutStock.find({ assemblyStatus: "Assembled" });

    if (assembledParts.length === 0) {
      console.log("No assembled parts found.");
      return [];
    }

    // Aggregate available parts by stock name
    const availableParts = assembledParts.reduce((acc, part) => {
      acc[part.stockName.toLowerCase()] =
        (acc[part.stockName.toLowerCase()] || 0) + part.quantity;
      return acc;
    }, {});

    const productConfigurations = [
      { productName: "IFPD", partsRequired: { PowerBoard: 1, MainBoard: 1 } },
      { productName: "Product B", partsRequired: { sensor: 2, motor: 1 } },
    ];

    const assemblyResults = [];

    for (const config of productConfigurations) {
      const { productName, partsRequired } = config;

      // Calculate how many products can be assembled
      const maxProducts = Math.min(
        ...Object.entries(partsRequired).map(([part, requiredQuantity]) =>
          Math.floor(
            (availableParts[part.toLowerCase()] || 0) / requiredQuantity
          )
        )
      );

      if (maxProducts > 0) {
        // Update the stock only if fully utilized
        for (const [part, requiredQuantity] of Object.entries(partsRequired)) {
          let remainingRequirement = requiredQuantity;

          for (const stock of assembledParts) {
            if (
              stock.stockName.toLowerCase() === part.toLowerCase() &&
              remainingRequirement > 0
            ) {
              const deduction = Math.min(stock.quantity, remainingRequirement);
              remainingRequirement -= deduction;

              if (deduction > 0) {
                const updatedStatus =
                  remainingRequirement === 0 ? "Used" : "Partially Used";

                await OutStock.findByIdAndUpdate(stock._id, {
                  assemblyStatus: updatedStatus,
                });
              }
            }
          }
        }

        // Increment the finished goods quantity by `maxProducts`
        const existingProduct = await FinishGood.findOne({ productName });

        if (existingProduct) {
          existingProduct.quantity += maxProducts;
          await existingProduct.save();
        } else {
          const newProduct = new FinishGood({
            productName,
            quantity: maxProducts,
            date: new Date(),
          });
          await newProduct.save();
        }

        console.log(
          `Finished product "${productName}" assembled successfully (${maxProducts} units).`
        );
        assemblyResults.push({
          productName,
          quantity: maxProducts,
          status: "Assembled",
        });
      } else {
        console.log(`Not enough parts to assemble product "${productName}".`);
        assemblyResults.push({ productName, status: "Insufficient parts" });
      }
    }

    return assemblyResults;
  } catch (error) {
    console.error("Error in automatic finished goods creation:", error);
    throw error;
  }
};

// Watch changes in OutStock collection
const changeStream = OutStock.watch();

changeStream.on("change", async (change) => {
  if (
    change.operationType === "update" &&
    change.updateDescription.updatedFields.assemblyStatus === "Assembled"
  ) {
    try {
      await checkAndCreateFinishedGoods();
    } catch (error) {
      console.error("Error in automatic finished goods creation:", error);
    }
  }
});

// Handle change stream errors
changeStream.on("error", (error) =>
  console.error("Change stream error:", error)
);

module.exports = OutStock;
