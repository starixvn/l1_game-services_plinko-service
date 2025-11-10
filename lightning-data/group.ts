import * as fs from "fs/promises";
import * as path from "path";

interface FileData {
    payouts: number[];
    cells: { row: number; column: number; multiplier: number }[];
    seed: string;
}

const BATCH_SIZE = 500;

const processFile = async (filePath: string, index: number) => {
    try {
        const fileContent = await fs.readFile(filePath, "utf-8");
        const data: FileData = JSON.parse(fileContent);

        // Extract only payouts and cells
        return {
            odds: data.payouts,
            pegMultipliers: data.cells,
            seed: data.seed,
            index,
        };
    } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
        return null;
    }
};

const processBatch = async (files: string[], dataDir: string) => {
    const promises = files.map((file, index) => {
        const filePath = path.join(dataDir, file);
        return processFile(filePath, index);
    });

    const results = await Promise.all(promises);
    return results.filter((data) => data !== null);
};

const main = async () => {
    const startTime = Date.now();
    const dataDir = path.join("lightning-data", "data");
    const groupDataDir = path.join("lightning-data", "batches");

    // Create group-data directory if it doesn't exist
    try {
        await fs.mkdir(groupDataDir, { recursive: true });
    } catch (error) {
        // Directory might already exist, that's fine
    }

    // Read all JSON files from data directory
    const files = (await fs.readdir(dataDir)).filter((file) => file.endsWith(".json"));
    console.log(`Processing ${files.length} files, grouping into batches of ${BATCH_SIZE}...`);

    const totalBatches = Math.ceil(files.length / BATCH_SIZE);
    let totalProcessed = 0;

    // Process files in batches
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE);

        // Process batch to extract payouts and cells
        const batchData = await processBatch(batch, dataDir);

        // Write batch to file
        const outputFileName = `${String(batchNumber + 1)}.json`;
        const outputPath = path.join(groupDataDir, outputFileName);
        await fs.writeFile(outputPath, JSON.stringify(batchData), "utf-8");

        totalProcessed += batchData.length;
        console.log(`Processed batch ${batchNumber + 1}/${totalBatches}: ${batchData.length} items -> ${outputFileName}`);
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n=== Summary ===`);
    console.log(`Completed in ${duration} seconds`);
    console.log(`Total files processed: ${totalProcessed}`);
    console.log(`Total batches created: ${totalBatches}`);
    console.log(`Output directory: ${groupDataDir}`);
};

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
