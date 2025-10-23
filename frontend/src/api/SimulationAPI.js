import { HTTP_STATUS } from "./httpCodes";

const BASE_HTTP_URL = "http://localhost:8000";
const BASE_WS_URL = "ws://localhost:8000";

export class SimulationAPI {
  /**
   * Attempts to create a readable error depending on what was sent back.
   * @param {*} response - the response from the last request made.
   * @param {*} defaultMessage - the default message if nothing could be obtained.
   * @returns an error with a message.
   */
  throwReadableError(response, defaultMessage) {
    let readableError = defaultMessage;

    return response.json().then((errorData) => {
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          // This handles Pydantic 422 validation errors
          const firstError = errorData.detail[0];
          // 'loc' is an array like ["body", "inflation_rate"]
          const field = firstError.loc.slice(1).join(" > ");
          readableError = `Invalid field '${field}': ${firstError.msg}`;
        } else {
          // This handles other errors, like 400 or 404
          readableError = errorData.detail;
        }
      }
      throw new Error(readableError);
    });
  }
  /**
   * Fetches the configuration for a given template.
   * @param {*} template - The name of the template to fetch configuration for.
   * @returns {Promise<object>} config - The configuration object for the specified template.
   * @throws {Error} If the fetch fails or the response is not OK.
   */
  static async getTemplateConfig(template) {
    const response = await fetch(`${BASE_HTTP_URL}/templates/${template}`);
    if (response.status === HTTP_STATUS.OK) {
      const config = await response.json();
      return config;
    } else {
      throwReadableError(
        response,
        `Failed to fetch configuration for template: ${template}`
      );
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
      throwReadableError(response, "Failed to create model.");
    }
  }

  /**
   * Gets the model policies for a given model ID.
   * @param {*} modelId - The ID of the model to fetch policies for.
   * @returns {Promise<object>} policies - The policies associated with the specified model.
   * @throws {Error} If the fetch fails or the response is not OK.
   */
  static async getModelPolicies(modelId) {
    const response = await fetch(`${BASE_HTTP_URL}/models/${modelId}/policies`);

    if (response.status === HTTP_STATUS.OK) {
      const policies = await response.json();
      return policies;
    } else {
      throwReadableError(
        response,
        `Failed to fetch policies for model ID ${modelId}`
      );
    }
  }

  /**
   * Sets the model policies for a given model ID.
   * @param {Object} modelId - The ID of the model to set policies for.
   * @param {Object} policies - The policies to set for the model.
   * @returns
   * @throws {Error} If the policies could not be set because the response is not NO_CONTENT.
   */
  static async setModelPolicies(modelId, policies) {
    const response = await fetch(
      `${BASE_HTTP_URL}/models/${modelId}/policies`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(policies),
      }
    );

    if (response.status === HTTP_STATUS.NO_CONTENT) {
      return;
    } else {
      throwReadableError(
        response,
        `Failed to set policies for model ID ${modelId}`
      );
    }
  }

  /**
   * Retrieves all of the model indicators for a given model ID.
   * @param {*} modelId - The ID of the model to get indicators for.
   * @param {*} startTime - The start time to get indicators for, defaults to 0
   * @param {*} endTime - The end time to get indicators for, defaults to 0(current time)
   * @returns {Object} - the indicator as a list of records.
   * @throws {Error} If the indicators could not be retrieved.
   */
  static async getModelIndicators(modelId, startTime = 0, endTime = 0) {
    // TODO: Should we give ability to fetch specific indicators? API can be changed to do that, see controller method to get indicators.
    const response = await fetch(
      `${BASE_HTTP_URL}/models/${modelId}/indicators`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_time: startTime,
          end_time: endTime,
        }),
      }
    );

    if (response.status === HTTP_STATUS.OK) {
      const data = await response.json();
      return data;
    } else {
      throwReadableError(
        response,
        `Failed to fetch indicators for model ID ${modelId}`
      );
    }
  }

  /**
   * Steps 1 time step for a given model ID.
   * @param {*} modelId - the ID of the model we are stepping through.
   * @returns
   * @throws {Error} If the model could not be stepped through.
   */
  static async stepModel(modelId) {
    const response = await fetch(`${BASE_HTTP_URL}/models/${modelId}/step`, {
      method: "POST",
    });

    if (response.status === HTTP_STATUS.NO_CONTENT) {
      return;
    } else {
      throwReadableError(response, `Failed to step model ID ${modelId}`);
    }
  }

  /**
   * Deletes a model for a given model ID.
   * @param {*} modelId - the ID of the model we are deleting.
   * @returns
   * @throws {Error} If the model could not be deleted.
   */
  static async deleteModel(modelId) {
    const response = await fetch(`${BASE_HTTP_URL}/models/${modelId}`, {
      method: "DELETE",
    });

    if (response.status === HTTP_STATUS.NO_CONTENT) {
      return;
    } else {
      throwReadableError(response, `Failed to delete model ID ${modelId}`);
    }
  }
}
