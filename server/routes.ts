import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHighScoreSchema } from "../shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get top high scores
  app.get("/api/highscores", async (_req: Request, res: Response) => {
    try {
      const highScores = await storage.getHighScores(10); // Get top 10 scores
      res.json(highScores);
    } catch (error) {
      console.error("Error getting high scores:", error);
      res.status(500).json({ error: "Failed to retrieve high scores" });
    }
  });
  
  // Add a new high score
  app.post("/api/highscores", async (req: Request, res: Response) => {
    try {
      // Validate the request body against our schema
      const result = insertHighScoreSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid high score data",
          details: result.error.format()
        });
      }
      
      // Additional validation for playerName (max 4 chars, uppercase)
      if (result.data.playerName.length > 4) {
        return res.status(400).json({
          error: "Player name must be 4 characters or less"
        });
      }
      
      // Convert name to uppercase
      result.data.playerName = result.data.playerName.toUpperCase();
      
      // Save the high score
      const highScore = await storage.createHighScore(result.data);
      res.status(201).json(highScore);
    } catch (error) {
      console.error("Error saving high score:", error);
      res.status(500).json({ error: "Failed to save high score" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
