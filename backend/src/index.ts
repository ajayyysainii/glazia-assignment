import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";

dotenv.config();

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
