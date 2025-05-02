/**
 * api.js
 *
 * This file provides mock API functions for the CalmSphere VRET application.
 * In a real application, these would make calls to a backend server.
 */

const API_ENDPOINT = "/api" // Replace with your actual API endpoint

/**
 * Sends progress data to the server.
 *
 * @param {object} data - The progress data to send.
 * @returns {Promise<object>} - A promise that resolves with the server response.
 */
export const sendProgress = async (data) => {
  console.log("Sending progress:", data)
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ status: "success", message: "Progress updated" })
    }, 500)
  })
}

/**
 * Logs anxiety levels to the server.
 *
 * @param {number} level - The current level of the therapy session.
 * @param {string} anxietyLevel - The anxiety level ('high', 'managed', etc.).
 * @returns {Promise<object>} - A promise that resolves with the server response.
 */
export const logAnxiety = async (level, anxietyLevel) => {
  console.log(`Logging anxiety: Level ${level}, Anxiety ${anxietyLevel}`)
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ status: "success", message: "Anxiety logged" })
    }, 500)
  })
}

/**
 * Handles API errors and logs them to the console.
 *
 * @param {object} errorData - An object containing information about the error.
 */
export const handleApiError = (errorData) => {
  console.error("API Error:", errorData)
}
