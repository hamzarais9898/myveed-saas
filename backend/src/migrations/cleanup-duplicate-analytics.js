const mongoose = require('mongoose');
const Analytics = require('../models/Analytics');
const { startOfDayUTC } = require('../utils/dateUtils');
require('dotenv').config();

/**
 * Migration: Cleanup Duplicate Analytics
 * Preserves the record with the latest lastUpdated for each (userId, videoId, platform, date) bucket.
 */
async function migrate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        console.log('Identifying duplicates...');
        const duplicates = await Analytics.aggregate([
            {
                $group: {
                    _id: {
                        userId: "$userId",
                        videoId: "$videoId",
                        platform: "$platform",
                        date: "$date"
                    },
                    count: { $sum: 1 },
                    docs: { $push: { _id: "$_id", lastUpdated: "$lastUpdated" } }
                }
            },
            { $match: { count: { $gt: 1 } } }
        ]);

        console.log(`Found ${duplicates.length} buckets with duplicates.`);

        let deletedCount = 0;
        for (const bucket of duplicates) {
            // Sort docs by lastUpdated desc
            const sortedDocs = bucket.docs.sort((a, b) => b.lastUpdated - a.lastUpdated);

            // Keep the first (most recent), delete the rest
            const idsToDelete = sortedDocs.slice(1).map(d => d._id);

            const result = await Analytics.deleteMany({ _id: { $in: idsToDelete } });
            deletedCount += result.deletedCount;
            console.log(`Cleaned bucket ${JSON.stringify(bucket._id)}: removed ${result.deletedCount} docs.`);
        }

        console.log(`Migration complete. Total duplicates deleted: ${deletedCount}`);

        console.log('Ensuring unique index...');
        // This will fail if duplicates still exist, confirming the migration worked
        await Analytics.createIndexes();
        console.log('Index ensured.');

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
