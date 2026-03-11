/**
 * Date Utilities for Analytics
 * Ensures consistent UTC 00:00:00.000 normalization
 */

/**
 * Normalizes a date to the start of its UTC day (00:00:00.000Z)
 * @param {Date|string|number} date 
 * @returns {Date}
 */
exports.startOfDayUTC = (date = new Date()) => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

/**
 * Returns the start of the next UTC day (00:00:00.000Z)
 * Useful for $lt filters in MongoDB
 * @param {Date|string|number} date 
 * @returns {Date}
 */
exports.endOfDayUTC = (date = new Date()) => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + 1);
    return d;
};
