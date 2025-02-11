import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import { Configuration, OpenAIApi } from "openai";

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  res.status(200).send({
    message: `Server is running properly!`,
  });
});

app.post("/", async (req, res) => {
  try {
    const data = req.body;
    console.log(data);

    const response = await openai.createCompletion({
      model: data.model,
      prompt: data.prompt,
      temperature: parseFloat(data.temp),
      max_tokens: parseFloat(data.maxTokens),
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0,
    });

    // Send the response from OpenAI back to the client
    res.status(200).send({
      bot: response.data.choices[0].text,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error.message || 'Something went wrong!' });
  }
});

app.listen(5000, () =>
  console.log("Server is running on port http://localhost:5000/")
);

