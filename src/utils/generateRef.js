const crypto = require('crypto');

const generateRef = () => {
    // Make sure this line is here!
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${hours}${minutes}${seconds}`;

    const random = crypto.randomBytes(3).toString('hex').toUpperCase();

    return `HER-${dateStr}-${timeStr}-${random}`;
};

module.exports = generateRef;
