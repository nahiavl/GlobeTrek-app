const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema({
    destination: String,
    startDate: Date,
    endDate: Date,
    state: String,
    owner: String,
    country: String,
    city: String,
    stars: Number,
    itinerary: [
      {
        day: String,
        description: [
          {
            place: String,
            description: String,
            tips: String,
            checked: Boolean 
          }
        ]
      }
    ]
  });
  
  const destinationSchema = new mongoose.Schema({
    location: {
      lon: { type: String, required: true },
      lat: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, required: true }
    },
    nearbyPlaces: [{
        name: { type: String, required: true },
        address: { type: String, required: true },
        website: { type: String },
        description: { type: String },
        opening_hours: { type: String },
        fee: { type: String }
    }]
  });

const Itinerary = mongoose.model('Itinerary', itinerarySchema);

const Destination = mongoose.model('Destination', destinationSchema);

async function createItinerary(body) {
    try {
        const itinerary = new Itinerary(body);
        await itinerary.save();
        return { data: itinerary };
    } catch (error) {
        return { error: error.message };
    }
}

async function removeItinerary(id) {
    try {
        const itinerary = mongoose.model('Itinerary', itinerarySchema);
        const result = await itinerary.findByIdAndDelete(id);
        return { data: result };
    } catch (error) {
        return { error: error.message };
    }
}

async function removeItineraryByOwner(id) {
    try {
        const itinerary = mongoose.model('Itinerary', itinerarySchema);
        const result = await itinerary.findOneAndDelete({ owner: id });
        return { data: result };
    } catch (error) {
        return { error: error.message };
    }
}

async function removeItineraryDay(itineraryId, index) {
    const itinerary = await Itinerary.findById(itineraryId);
    if (!itinerary || index >= itinerary.itinerary.length) {
      return { success: false, message: "Invalid itinerary ID or day index." };
    }
    itinerary.itinerary.splice(index, 1);
    await itinerary.save();
    return { success: true, data: itinerary };
}

async function addItineraryDay(itineraryId, newDay) {
    try {
        const itinerary = await Itinerary.findById(itineraryId);
        if (!itinerary) {
            return { success: false, message: "Itinerary not found." };
        }
        itinerary.itinerary.push(newDay);
        await itinerary.save();
        return { success: true, data: itinerary };
    } catch (error) {
        return { success: false, message: error.message };
    }
}
  

async function getItinerary(id) {
    try {
        const itinerary = mongoose.model('Itinerary', itinerarySchema);
        const result = await itinerary.findById(id);
        return { data: result };
    } catch (error) {
        return { error: error.message };
    }
}

async function getItineraryByUser(id) {
    try {
        const itinerary = mongoose.model('Itinerary', itinerarySchema);
        const result = await itinerary.find({"owner": id}).lean();
        if (result.length === 0) {
            return { data: [] };
        }
        return { data: result };
    } catch (error) {
        return { error: error.message };
    }
}

async function modifyItinerary(id, body) {
    try {
        const result = await Itinerary.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        );
        return { data: result };
    } catch (error) {
        return { error: error.message };
    }
}

async function createDestination(body) {
    try {
        const destination = new Destination(body);
        await destination.save();
        return { data: destination };
    } catch (error) {
        return { error: error.message };
    }
}

async function removeDestination(id) {
    try {
        const destination = mongoose.model('Destination', destinationSchema);
        const result = await destination.findByIdAndDelete(id);
        return { data: result };
    } catch (error) {
        return { error: error.message };
    }
}

async function getDestination(id) {
    try {
        const destination = mongoose.model('Destination', destinationSchema);
        const result = await destination.findById(id);
        return { data: result };
    } catch (error) {
        return { error: error.message };
    }
}

async function destinationExists(city, country) {
    const destination = await Destination.findOne({ 'location.city': city, 'location.country': country });
    if (destination) {
        return { exists: true, data: destination };
      } else {
        return { exists: false };
      }
}

module.exports = { createItinerary, removeItinerary, getItinerary, 
    modifyItinerary, getItineraryByUser, removeItineraryDay, addItineraryDay, 
    removeItineraryByOwner, createDestination, removeDestination, getDestination,
    destinationExists };