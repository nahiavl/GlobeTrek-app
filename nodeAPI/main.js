require('dotenv').config();
const fetch = require('node-fetch');
const { createItinerary, getItinerary, removeItinerary, removeItineraryByOwner, modifyItinerary, getItineraryByUser, removeItineraryDay, addItineraryDay, createDestination, getDestination, removeDestination, destinationExists } = require('./db');
const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const { verifyToken } = require('./auth');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const port = process.env.PORT || 3000;

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: 'Itinerary & places API',
      version: '1.0.0',
      description: 'API for managing itineraries',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./main.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

/**
 * @swagger
 * /itineraries/create:
 *   post:
 *     summary: Create a new itinerary
 *     tags:
 *       - Itineraries
 *     description: Create a new itinerary.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               destination:
 *                 type: string
 *                 description: The destination for the itinerary
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: The start date of the itinerary
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: The end date of the itinerary
 *               state:
 *                 type: string
 *                 description: The state where the destination is located
 *               owner:
 *                 type: string
 *                 description: The owner or user ID for the itinerary
 *               country:
 *                 type: string
 *                 description: The country of the destination
 *               city:
 *                 type: string
 *                 description: The city of the destination
 *               stars:
 *                 type: number
 *                 description: A rating for the itinerary (e.g., 1-5 stars)
 *               itinerary:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day:
 *                       type: string
 *                       description: The day of the itinerary (e.g., Day 1)
 *                     description:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           place:
 *                             type: string
 *                             description: The place to visit
 *                           description:
 *                             type: string
 *                             description: A description of the place
 *                           tips:
 *                             type: string
 *                             description: Tips for visiting the place
 *                           checked:
 *                             type: boolean
 *                             description: Whether the place has been visited or not
 *     responses:
 *       200:
 *         description: Itinerary created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The ID of the created itinerary
 *       400:
 *         description: Invalid input
 */
app.post('/itineraries/create', verifyToken, async (req, res) => {
  const userIdFromToken = req.user_id;
    
  if (userIdFromToken) {
    const result = await createItinerary(req.body);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json(result.data);
  } else {
    return res.status(401).json({ message: "Not authorized." });
  }
});

/**
 * @swagger
 * /itineraries/modify/{uid}:
 *   patch:
 *     summary: Modify an existing itinerary
 *     tags:
 *       - Itineraries
 *     description: Modify the details of an existing itinerary using its unique identifier.
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         description: Unique ID of the itinerary to be modified.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               destination:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               state:
 *                 type: string
 *               owner:
 *                 type: string
 *               country:
 *                 type: string
 *               city:
 *                 type: string
 *               stars:
 *                 type: number
 *               itinerary:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day:
 *                       type: string
 *                     description:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           place:
 *                             type: string
 *                           description:
 *                             type: string
 *                           tips:
 *                             type: string
 *                           checked:
 *                             type: boolean
 *     responses:
 *       200:
 *         description: Itinerary modified successfully.
 *       400:
 *         description: Invalid input or update failed.
 */
app.patch('/itineraries/modify/:uid', verifyToken, async (req, res) => {
  const userIdFromToken = req.user_id;

  const itinerary = await getItinerary(req.params.uid);
  
  if (String(userIdFromToken) !== String(itinerary.data.owner)) {
    return res.status(401).json({ message: "Not authorized." });
  } else {
    const result = await modifyItinerary(req.params.uid, req.body);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json(result.data);
  }
  
});

/**
 * @swagger
 * /itineraries/delete/{uid}:
 *   delete:
 *     summary: Delete an itinerary
 *     tags:
 *       - Itineraries
 *     description: Delete an itinerary using its unique ID.
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         description: Unique ID of the itinerary to be deleted.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Itinerary deleted successfully.
 *       400:
 *         description: Deletion failed or itinerary not found.
 */
app.delete('/itineraries/delete/:uid', verifyToken, async (req, res) => {
  const userIdFromToken = req.user_id;

  const itinerary = await getItinerary(req.params.uid);
  
  if (String(userIdFromToken) !== String(itinerary.data.owner)) {
    return res.status(401).json({ message: "Not authorized." });
  } else {
    const result = await removeItinerary(req.params.uid);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json(result.data);
  }
});

/**
 * @swagger
 * /itineraries/deleteByOwner/{uid}:
 *   delete:
 *     summary: Delete all itineraries for an owner
 *     tags:
 *       - Itineraries
 *     description: Delete all itineraries associated with a specific owner.
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         description: Unique ID of the owner whose itineraries should be deleted.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Itineraries deleted successfully.
 *       404:
 *         description: No itineraries found for the specified owner.
 *       500:
 *         description: Server error.
 */
app.delete('/itineraries/deleteByOwner/:uid', verifyToken, async (req, res) => {
  const userIdFromToken = req.user_id;
  if (String(userIdFromToken) !== String(req.params.uid)) {
    return res.status(401).json({ message: "Not authorized." });
  } else {
    try {
      const result = await removeItineraryByOwner(req.params.uid);
      if (!result.data) {
        return res.status(404).json({ error: "Itinerary not found" });
      }
      return res.status(200).json(result.data);
    } catch (error) {
      return res.status(500).json({ error: "Server error: " + error.message });
    }
  }
});

/**
 * @swagger
 * /itinerariesDays/delete/{id}/days/{dayIndex}:
 *   delete:
 *     summary: Delete a specific day from an itinerary
 *     tags:
 *       - Itineraries
 *     description: Remove a specific day (by index) from an itinerary.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Unique ID of the itinerary.
 *         schema:
 *           type: string
 *       - in: path
 *         name: dayIndex
 *         required: true
 *         description: Index of the day to remove (starting from 0).
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Day removed successfully.
 *       400:
 *         description: Invalid itinerary ID or day index.
 */
app.delete('/itinerariesDays/delete/:id/days/:dayIndex', verifyToken, async (req, res) => {
  const userIdFromToken = req.user_id;
  const { id, dayIndex } = req.params;
  
  const itinerary = await getItinerary(req.params.id);
  
  if (String(userIdFromToken) !== String(itinerary.data.owner)) {
    return res.status(401).json({ message: "Not authorized." });
  } else {
    const index = parseInt(dayIndex);
    const result = await removeItineraryDay(id, index);
    
    if (result.success) {
        return res.status(200).json(result);
    } else {
        return res.status(400).json({ error: result.message });
    }
  }
});

/**
 * @swagger
 * /itinerariesDays/add/{id}:
 *   patch:
 *     summary: Add a day to an itinerary
 *     tags:
 *       - Itineraries
 *     description: Add a new day with details to an existing itinerary.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Unique ID of the itinerary.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               day:
 *                 type: string
 *                 description: The day label (e.g., "Day 1").
 *               description:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     place:
 *                       type: string
 *                     description:
 *                       type: string
 *                     tips:
 *                       type: string
 *                     checked:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Day added successfully.
 *       400:
 *         description: Invalid input or itinerary ID.
 */
app.patch('/itinerariesDays/add/:id', verifyToken, async (req, res) => {
  const userIdFromToken = req.user_id;
  const itinerary = await getItinerary(req.params.id);
  const { id } = req.params;
  const { day, description } = req.body;

  if (String(userIdFromToken) !== String(itinerary.data.owner)) {
    return res.status(401).json({ message: "Not authorized." });
  } else {
    
    if (!day || !description) {
        return res.status(400).json({ error: "Day and description are required." });
    }

    const result = await addItineraryDay(id, { day, description });

    if (result.success) {
        return res.status(200).json(result.data);
    } else {
        return res.status(400).json({ error: result.message });
    }
  }
});

/**
 * @swagger
 * /itineraries/get/{uid}:
 *   get:
 *     summary: Get an itinerary by ID
 *     tags:
 *       - Itineraries
 *     description: Fetch an itinerary using its unique ID. Requires authorization.
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         description: Unique ID of the itinerary.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Itinerary fetched successfully.
 *       400:
 *         description: Invalid ID or not authorized.
 *       401:
 *         description: Not authorized to access this itinerary.
 *       404:
 *         description: Itinerary not found (or has been deleted).
 */
app.get('/itineraries/get/:uid', verifyToken, async (req, res) => {
  const userIdFromToken = req.user_id;

  const result = await getItinerary(req.params.uid);

  if (!result || !result.data) {
    return res.status(404).json({ message: 'Itinerary not found (or has been deleted)' });
  }

  if (String(userIdFromToken) !== String(result.data.owner)) {
    return res.status(401).json({ message: "Not authorized." });
  }

  return res.status(200).json(result.data);
});

/**
 * @swagger
 * /itineraries/byUser/{uid}:
 *   get:
 *     summary: Get itineraries by user ID
 *     tags:
 *       - Itineraries
 *     description: Fetch all itineraries associated with a user.
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         description: Unique ID of the user.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Itineraries fetched successfully.
 *       400:
 *         description: Invalid user ID.
 */
app.get('/itineraries/byUser/:uid', verifyToken, async (req, res) => {
  const userIdFromToken = req.user_id;
  
  if (String(userIdFromToken) !== String(req.params.uid)) {
    return res.status(401).json({ message: "Not authorized." });
  } else { 
    const result = await getItineraryByUser(req.params.uid);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json(result.data);
  }
});

/**
 * @swagger
 * /itineraries/personalize/{place_name}/{country}:
 *   post:
 *     summary: Generate a personalized travel itinerary
 *     tags:
 *       - Itineraries
 *     description: Generate a detailed travel itinerary in JSON format based on user preferences for a specific place and country.
 *     parameters:
 *       - in: path
 *         name: place_name
 *         required: true
 *         description: Name of the place to generate the itinerary for.
 *         schema:
 *           type: string
 *       - in: path
 *         name: country
 *         required: true
 *         description: Country of the specified place.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *                 description: Language in which the itinerary should be generated.
 *               prompt:
 *                 type: string
 *                 description: User preferences for the itinerary.
 *     responses:
 *       200:
 *         description: Personalized itinerary generated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               description: JSON-formatted travel itinerary.
 *       500:
 *         description: Server error while generating the itinerary.
 */
app.post('/itineraries/personalize/:place_name/:country', verifyToken, async (req, res) => {
  const userIdFromToken = req.user_id;

  const placeName = req.params.place_name;
  const country = req.params.country;
  
  if (userIdFromToken) {
    const result = await getInfoSummary(placeName, country);

    var info = "";
    if (!result.error) {
      info = "Use this information: " + result.output
    }

    try {
      let prompt = `Generate a detailed travel itinerary in ${req.body.language} based on the preferences provided: ${req.body.prompt}. 
      Return the itinerary strictly in JSON format only, without any additional text, comments, or explanations. ${info}

      The JSON output should match the exact structure below, formatted as a single line with no extra spaces, line breaks, or comments. Ensure it is properly structured for direct use as valid JSON.

      {"destination":"City name based on user preferences","itinerary":[{"day":"Day 1","description":[{"place":"Name of the first place to visit","description":"Detailed information about this place, including historical, cultural, or recreational significance.","tips":"Useful advice on visiting, such as the best times, local recommendations, or nearby attractions."},{"place":"Name of the second place to visit","description":"Details about this place, explaining its uniqueness or importance in the city.","tips":"Specific tips for this location, like timing, nearby dining, or local customs."}]},{"day":"Day 2","description":[{"place":"Name of a third place to visit","description":"Description of the third place.","tips":"Tips for visiting the third place."},{"place":"Name of a fourth place to visit","description":"Description of the fourth place.","tips":"Tips for visiting the fourth place."}]},{"day":"Day 3","description":[{"place":"Name of a fifth place to visit","description":"Description of the fifth place.","tips":"Tips for visiting the fifth place."},{"place":"Name of a sixth place to visit","description":"Description of the sixth place.","tips":"Tips for visiting the sixth place."}]}]}

      **Important Instructions:**
      1. **Exact Key Names**: Use these keys without changes: "destination", "itinerary", "day", "description", "place", "tips".
      2. **Single-Line JSON**: Output JSON must be a single line, with no line breaks, unnecessary spaces, or extra characters.
      3. **Error-Free JSON Structure**: Ensure proper bracket nesting and placement to avoid parsing errors.
      4. **Multiple Entries Per Day**: Each "description" array must contain at least two unique activities with accurate details and tips for each day.

      Return only the JSON output as shown, without explanations or extra characters.
      `;

      const response = await promptOllama(prompt);
      res.send(response);
    } catch (error) {
      res.status(500).json({ error: error });
    }
  } else {
    return res.status(401).json({ message: "Not authorized." });
  }
});

/**
 * @swagger
 * /place/info_summary/{place_name}/{country}:
 *   get:
 *     summary: Get a summarized description of a place
 *     tags:
 *       - Places
 *     description: Fetch a brief summary of a place, including key information about its location.
 *     parameters:
 *       - in: path
 *         name: place_name
 *         required: true
 *         description: Name of the place to summarize.
 *         schema:
 *           type: string
 *       - in: path
 *         name: country
 *         required: true
 *         description: Country of the specified place.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Summary retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 output:
 *                   type: string
 *                   description: Summarized information about the place.
 *       404:
 *         description: Place not found.
 *       500:
 *         description: Internal server error.
 */
app.get('/place/info_summary/:place_name/:country', verifyToken, async (req, res) => {
  const userIdFromToken = req.user_id;
  if (userIdFromToken) {
    const placeName = req.params.place_name;
    const country = req.params.country;

    const result = await getInfoSummary(placeName, country);

    if (result.error) {
      return res.status(result.error === "Error: " + error ? 500 : 404).json(result);
    }

    res.status(200).json({ output: result.output });
  } else {
    return res.status(401).json({ message: "Not authorized." });
  }
});

/**
 * @swagger
 * /place/info/{place_name}/{country}:
 *   get:
 *     summary: Get detailed information about a place
 *     tags:
 *       - Places
 *     description: Fetch detailed information about a place, including its location and nearby attractions.
 *     parameters:
 *       - in: path
 *         name: place_name
 *         required: true
 *         description: Name of the place to get information for.
 *         schema:
 *           type: string
 *       - in: path
 *         name: country
 *         required: true
 *         description: Country of the specified place.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Information retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 location:
 *                   type: object
 *                   description: Latitude and longitude of the place.
 *                 nearbyPlaces:
 *                   type: object
 *                   description: Details about attractions or locations near the specified place.
 *       404:
 *         description: Place not found.
 *       500:
 *         description: Internal server error.
 */
app.get('/place/info/:place_name/:country', verifyToken, async (req, res) => {
  const userIdFromToken = req.user_id;
  if (userIdFromToken) {
    try {
      const placeName = req.params.place_name;
      const country = req.params.country;

      const locationResult = await getLonLat(placeName, country);
      if (locationResult.error) return res.status(404).json(locationResult);

      const infoResult = await getInfo(locationResult.lon, locationResult.lat, placeName, country);
      if (infoResult.error) return res.status(404).json(infoResult);

      res.status(200).json({
        location: locationResult,
        nearbyPlaces: infoResult,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized." });
  }
});

/**
 * @swagger
 * /destination:
 *   post:
 *     summary: Create a new destination
 *     tags:
 *       - Places
 *     description: Add a new destination with its details to the database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the destination.
 *               country:
 *                 type: string
 *                 description: Country of the destination.
 *               description:
 *                 type: string
 *                 description: Detailed description of the destination.
 *               coordinates:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lon:
 *                     type: number
 *     responses:
 *       200:
 *         description: Destination created successfully.
 *       400:
 *         description: Invalid input data.
 */
app.post('/destination', verifyToken, async (req, res) => {
  const userIdFromToken = req.user_id;
  if (userIdFromToken) {
    const result = await createDestination(req.body);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json(result.data);
  } else {
    return res.status(401).json({ message: "Not authorized." });
  }
});

/**
 * @swagger
 * /destination/{id}:
 *   get:
 *     summary: Get details of a destination
 *     tags:
 *       - Places
 *     description: Retrieve details of a specific destination using its unique identifier.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Unique ID of the destination.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Destination details retrieved successfully.
 *       400:
 *         description: Destination not found or invalid ID.
 */
app.get('/destination/:id', verifyToken, async (req, res) => {
  const userIdFromToken = req.user_id;

  if (userIdFromToken) {
    const result = await getDestination(req.params.uid);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json(result.data);
  } else {
    return res.status(401).json({ message: "Not authorized." });
  }
});

/**
 * @swagger
 * /destination/{uid}:
 *   delete:
 *     summary: Delete a destination
 *     tags:
 *       - Places
 *     description: Delete a destination from the database using its unique ID.
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         description: Unique ID of the destination to delete.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Destination deleted successfully.
 *       400:
 *         description: Invalid ID or destination not found.
 */
app.delete('/destination/:uid', verifyToken, async (req, res) => {
  const userIdFromToken = req.user_id;
  if (userIdFromToken) {
    const result = await removeDestination(req.params.uid);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json(result.data);
  } else {
    return res.status(401).json({ message: "Not authorized." });
  }
});

async function getLonLat(city, country) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${city}, ${country}&format=json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) return { error: "Error fetching data from the API" };

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return { error: "No results found" };

    const { lon, lat, display_name } = data[0];
    return { lon, lat, display_name };
  } catch (error) {
    return { error: "Internal Server Error" };
  }
}

async function getInfo(lon, lat, city, country) {
  try {
    const dataInDB = await destinationExists(city, country);
    let data = null;

    if (dataInDB.exists) {
      data = dataInDB.data;
    } else {
      const response = await fetch(
        `https://api.geoapify.com/v2/places?categories=entertainment&filter=circle:${lon},${lat},5000&limit=20&apiKey=${process.env.GEOAPIFY_API_KEY}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) return { error: "Error fetching data from the API" };

      data = await response.json();
      if (!Array.isArray(data.features) || data.features.length === 0) {
        return { error: "Not found" };
      }

      const nearbyPlaces = data.features
        .map((feature) => ({
          name: feature.properties.name || '',
          address: feature.properties.formatted || '',
          website: feature.properties.url || '',
          description: feature.properties.description || '',
          opening_hours: feature.properties.opening_hours || '',
          fee: feature.properties.fee || '',
        }))
        .filter((place) => place.name.trim() !== '');

      const destinationData = {
        location: {
          lon,
          lat,
          city,
          country,
        },
        nearbyPlaces,
      };

      const saveResult = await createDestination(destinationData);
      if (saveResult.error) {
        return { error: "Failed to save destination data" };
      }

      data = saveResult.data;
    }

    return data.nearbyPlaces.map((place) => ({
      name: place.name,
      address: place.address,
      description: place.description,
      website: place.website,
      opening_hours: place.opening_hours,
      fee: place.fee,
    }));

  } catch (error) {
    return { error: "Internal Server Error" };
  }
}

async function promptOllama(prompt) {
  const model = {
    model: 'mistral',
    prompt,
    stream: false
  };

  const url = `${process.env.OLLAMA_URL}/api/generate`;

try {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(model),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Ollama API error: ${errorData.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.response;
} catch (error) {
  console.error('Request failed for URL:', url);
  console.error('Error details:', error);
  throw error;
}

}

async function getInfoSummary(placeName, country) {
  try {
    const locationResult = await getLonLat(placeName, country);
    if (locationResult.error) return res.status(404).json(locationResult);

    const infoResult = await getInfo(locationResult.lon, locationResult.lat, placeName, country);
    if (infoResult.error) return res.status(404).json(infoResult);

    const prompt = `Make a detailed summary of the places to visit in ${placeName}: ${JSON.stringify(infoResult)}`;
    const response = await promptOllama(prompt);
    return { output: response };
  } catch (error) {
    return { error: "Error: " +error }
  }
}

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});