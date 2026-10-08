import dotenv from "dotenv";
dotenv.config({
    path: "./.env"
});

import { app } from "./app.js";
import connectDB from "./db/db.connect.js";


connectDB()
    // .then(() => {
    //     app.on("error", (error) => {
    //         console.log("Error: ", error);
    //         throw error;
    //     });
    //     })
    // .catch((err) => {
    //     console.log("MongoDB connection failed! ", err);
    // });

app.listen(process.env.PORT || 8000, () => {
    console.log(`⚙️  Server is running at port : ${process.env.PORT || 8000}`);
});