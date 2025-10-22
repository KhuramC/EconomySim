import { HTTP_STATUS } from "./httpCodes";

const BASE_HTTP_URL = "http://localhost:8000";
const BASE_WS_URL = "ws://localhost:8000";

export class SimulationAPI {
  
  static async getTemplateConfig(template) {
    const response = await fetch(`${BASE_HTTP_URL}/templates/${template}`);
    if (response.status === HTTP_STATUS.OK) {
      const config = await response.json();
      return config;
    } else {
      let errorDetail = `Failed to fetch template config for ${template}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorDetail = errorData.detail;
        }
      } catch (e) {
        // Ignore if error response isn't JSON
      }
      throw new Error(errorDetail);
    }
  }

  /**
   * @param {object} payload - Should contain all necessary fields to create a model and match the ModelCreateRequest.
   * @returns {Promsise<number>} modelId - The ID of the created model.
   * @throws {Error} If the model creation fails.
   */
  static async createModel(payload) {
    const response = await fetch(`${BASE_HTTP_URL}/models/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.status === HTTP_STATUS.CREATED) {
      const modelId = await response.json();
      return modelId;
    } else {
      // This 'else' block is new and improved
      const errorData = await response.json();
      let readableError = "Failed to create model.";

      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          // This handles Pydantic 422 validation errors
          const firstError = errorData.detail[0];
          // 'loc' is an array like ["body", "inflation_rate"]
          const field = firstError.loc.slice(1).join(" > ");
          readableError = `Invalid field '${field}': ${firstError.msg}`;
        } else {
          // This handles other errors, like your 400 or 404
          readableError = errorData.detail;
        }
      }

      throw new Error(readableError);
    }
  }
}
