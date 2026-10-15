require("dotenv").config();
const mongoose = require("mongoose");

const obsoleteIndexes = [
  { collection: "workspaces", name: "workspaceId_1" },
  { collection: "workspacefiles", name: "workspaceId_1" },
  { collection: "workspacefiles", name: "workspaceId_1_name_1" },
];

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from the environment");
  }

  await mongoose.connect(process.env.MONGO_URI);

  try {
    for (const { collection: collectionName, name } of obsoleteIndexes) {
      const collection = mongoose.connection.collection(collectionName);
      const indexes = await collection.indexes();

      if (!indexes.some((index) => index.name === name)) {
        console.log(`Already absent: ${collectionName}.${name}`);
        continue;
      }

      await collection.dropIndex(name);
      console.log(`Removed: ${collectionName}.${name}`);
    }

    console.log("Legacy workspace index migration completed.");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Legacy index migration failed:", error.message);
  process.exitCode = 1;
});