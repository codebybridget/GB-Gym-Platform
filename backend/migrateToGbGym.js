import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

const sourceDbName = "test"
const targetDbName = "gb-gym"

const legacyCollections = [
  "users",
  "exercises",
  "programs",
  "programassignments",
  "trainerassignments",
  "workoutlogs",
  "classschedules",
]

const migrate = async () => {
  let sourceConnection
  let targetConnection

  try {
    console.log("Connecting to MongoDB...")

    const baseUri =
      process.env.MONGO_URI

    if (!baseUri) {
      throw new Error(
        "MONGO_URI is missing from .env",
      )
    }

    /*
    |--------------------------------------------------------------------------
    | Connect to current database
    |--------------------------------------------------------------------------
    */

    const sourceUri =
      baseUri.replace(
        ".net/",
        `.net/${sourceDbName}`,
      )

    sourceConnection =
      await mongoose.createConnection(
        sourceUri,
      ).asPromise()

    console.log(
      `Connected to source database: ${sourceDbName}`,
    )

    /*
    |--------------------------------------------------------------------------
    | Connect to new GB database
    |--------------------------------------------------------------------------
    */

    const targetUri =
      baseUri.replace(
        ".net/",
        `.net/${targetDbName}`,
      )

    targetConnection =
      await mongoose.createConnection(
        targetUri,
      ).asPromise()

    console.log(
      `Connected to target database: ${targetDbName}`,
    )

    const sourceDb =
      sourceConnection.db

    const targetDb =
      targetConnection.db

    /*
    |--------------------------------------------------------------------------
    | Migrate each GB collection
    |--------------------------------------------------------------------------
    */

    for (
      const collectionName of
      legacyCollections
    ) {
      console.log("")
      console.log(
        `Processing: ${collectionName}`,
      )

      const exists =
        await sourceDb
          .listCollections({
            name: collectionName,
          })
          .hasNext()

      if (!exists) {
        console.log(
          `Skipping ${collectionName} - collection does not exist.`,
        )

        continue
      }

      const sourceCollection =
        sourceDb.collection(
          collectionName,
        )

      const targetCollection =
        targetDb.collection(
          collectionName,
        )

      /*
      |--------------------------------------------------------------------------
      | Read documents
      |--------------------------------------------------------------------------
      */

      const documents =
        await sourceCollection
          .find({})
          .toArray()

      console.log(
        `Found ${documents.length} documents.`,
      )

      /*
      |--------------------------------------------------------------------------
      | Clear target collection
      |--------------------------------------------------------------------------
      */

      try {
        await targetCollection.deleteMany(
          {},
        )
      } catch {
        // Collection may not exist yet.
      }

      /*
      |--------------------------------------------------------------------------
      | Copy documents
      |--------------------------------------------------------------------------
      */

      if (
        documents.length > 0
      ) {
        await targetCollection.insertMany(
          documents,
          {
            ordered: false,
          },
        )
      }

      /*
      |--------------------------------------------------------------------------
      | Copy indexes
      |--------------------------------------------------------------------------
      */

      const indexes =
        await sourceCollection
          .indexes()

      for (
        const index of indexes
      ) {
        if (
          index.name ===
          "_id_"
        ) {
          continue
        }

        const {
          key,
          name,
          ...options
        } = index

        try {
          await targetCollection.createIndex(
            key,
            {
              ...options,
              name,
            },
          )
        } catch (error) {
          console.log(
            `Index ${name} could not be copied: ${error.message}`,
          )
        }
      }

      console.log(
        `✓ ${collectionName} migrated successfully.`,
      )
    }

    console.log("")
    console.log(
      "======================================",
    )
    console.log(
      "GB DATABASE MIGRATION COMPLETE",
    )
    console.log(
      "======================================",
    )

    console.log(
      `Source: ${sourceDbName}`,
    )

    console.log(
      `Target: ${targetDbName}`,
    )

    console.log("")
    console.log(
      "The next step is to change MONGO_URI to gb-gym.",
    )
  } catch (error) {
    console.error("")
    console.error(
      "MIGRATION FAILED:",
    )
    console.error(
      error,
    )

    process.exitCode = 1
  } finally {
    if (
      sourceConnection
    ) {
      await sourceConnection.close()
    }

    if (
      targetConnection
    ) {
      await targetConnection.close()
    }
  }
}

migrate()