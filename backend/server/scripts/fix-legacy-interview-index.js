require("dotenv").config();
const mongoose = require("mongoose");

const collectionName = "interviews";
const indexName = "workspaceId_1";

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from the environment");
  }

  await mongoose.connect(process.env.MONGO_URI);

  try {
    const collection = mongoose.connection.collection(collectionName);
    const indexes = await collection.indexes();
    const legacyIndex = indexes.find((index) => index.name === indexName);

    if (!legacyIndex) {
      console.log(`Already absent: ${collectionName}.${indexName}`);
      return;
    }

    const isWorkspaceIdIndex =
      Object.keys(legacyIndex.key).length === 1 &&
      legacyIndex.key.workspaceId === 1 &&
      legacyIndex.unique === true;

    if (!isWorkspaceIdIndex) {
      throw new Error(`Refusing to remove unexpected index ${collectionName}.${indexName}`);
    }

    await collection.dropIndex(indexName);
    console.log(`Removed obsolete unique index: ${collectionName}.${indexName}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Legacy interview index migration failed:", error.message);
  process.exitCode = 1;
});
