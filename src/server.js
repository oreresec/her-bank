require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/databaseConfig');
const PORT = process.env.PORT || 3005;

const start = async () => {
    try {await connectDB();app.listen(PORT, () => {console.log(`Server running on port ${PORT}`);});
    } catch (error) {
        console.error(`Failed to connect to database: ${error.message}`);
        process.exit(1);
    }
};

start();
