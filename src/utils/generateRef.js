const generateRef = () => {
    const date =  new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `HER-${dateStr}-${random}`;
}
module.exports = generateRef;
