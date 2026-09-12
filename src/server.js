require('dotenv').config();
const app = require('./app');

app.set('trust proxy', 1);
const connectDB = require('./config/databaseConfig');
const PORT = process.env.PORT || 3005;


app.get('/', (req, res) => {
    res.status(200).json({status: "SUCCESS",message: "welcome, go back"});
});

const start = async () => {
    try {await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error(`Failed to connect to database: ${error.message}`);
        process.exit(1);
    }
};

start();
