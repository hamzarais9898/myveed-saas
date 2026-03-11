require('dotenv').config();
const mongoose = require('mongoose');
const Video = require('../src/models/Video');
const { scheduleMultiPlatforms } = require('../src/services/schedulerService');

async function verifyPersistence() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myveed');
        console.log('Connected to MongoDB');

        // 1. Create a test video
        const video = new Video({
            userId: new mongoose.Types.ObjectId(),
            promptText: 'Verification Test Video',
            status: 'generated',
            videoUrl: 'https://example.com/video.mp4'
        });
        await video.save();
        console.log('Created test video:', video._id);

        // 2. Schedule for multiple platforms
        const platformConfig = {
            tiktok: { startDate: new Date(Date.now() + 3600000) },
            youtube: { startDate: new Date(Date.now() + 7200000) }
        };

        await scheduleMultiPlatforms(video._id, platformConfig);
        console.log('Scheduled platforms');

        // 3. Re-fetch and check schedules
        const verifiedVideo = await Video.findById(video._id).lean();
        console.log('Verified Schedules:', JSON.stringify(verifiedVideo.schedules, null, 2));

        const ok = verifiedVideo.schedules.tiktok?.date && verifiedVideo.schedules.youtube?.date;
        if (ok) {
            console.log('✅ PERSISTENCE VERIFIED: Dates are present in MongoDB');
        } else {
            console.error('❌ PERSISTENCE FAILED: Dates are missing');
        }

        // Cleanup
        await Video.deleteOne({ _id: video._id });
        await mongoose.disconnect();
        process.exit(ok ? 0 : 1);
    } catch (err) {
        console.error('Verification error:', err);
        process.exit(1);
    }
}

verifyPersistence();
