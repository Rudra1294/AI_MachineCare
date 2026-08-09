const axios = require('axios');

const getPredictionAndSchedule = async (sensorPayload, availableTechnicians) => {
    try {
        const response = await axios.post(`${process.env.PYTHON_API_URL}/api/predict_and_schedule`, {
            available_technicians: availableTechnicians,
            machines: sensorPayload
        });
        return response.data;
    } catch (error) {
        console.error("Error communicating with Python Microservice:", error.message);
        throw new Error("AI Engine unavailable");
    }
};

module.exports = { getPredictionAndSchedule };