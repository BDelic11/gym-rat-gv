import OpenAI from "openai"

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable")
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Workout parsing schema
export const workoutSchema = {
  type: "object",
  properties: {
    name: { type: "string", description: "Name of the workout" },
    duration: { type: "number", description: "Duration in minutes" },
    exercises: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Exercise name" },
          category: {
            type: "string",
            enum: ["strength", "cardio", "flexibility", "other"],
            description: "Exercise category",
          },
          sets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                reps: { type: "number", description: "Number of repetitions" },
                weight: { type: "number", description: "Weight in kg" },
                duration: { type: "number", description: "Duration in seconds" },
                distance: { type: "number", description: "Distance in km" },
                restTime: { type: "number", description: "Rest time in seconds" },
              },
            },
          },
        },
        required: ["name", "category", "sets"],
      },
    },
  },
  required: ["name", "exercises"],
}

// Meal parsing schema
export const mealSchema = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: ["breakfast", "lunch", "dinner", "snack", "mid_meal"],
      description: "Type of meal",
    },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Food item name" },
          quantity: { type: "number", description: "Quantity amount" },
          unit: {
            type: "string",
            enum: ["g", "ml", "cup", "piece", "tbsp", "tsp", "oz"],
            description: "Unit of measurement",
          },
          calories: { type: "number", description: "Estimated calories" },
          protein: { type: "number", description: "Protein in grams" },
          carbs: { type: "number", description: "Carbohydrates in grams" },
          fat: { type: "number", description: "Fat in grams" },
          fiber: { type: "number", description: "Fiber in grams" },
          sugar: { type: "number", description: "Sugar in grams" },
          sodium: { type: "number", description: "Sodium in mg" },
        },
        required: ["name", "quantity", "unit", "calories", "protein", "carbs", "fat"],
      },
    },
  },
  required: ["type", "items"],
}
