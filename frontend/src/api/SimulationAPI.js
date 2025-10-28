import { HTTP_STATUS } from "./httpCodes";
import { buildPoliciesPayload, buildCreatePayload } from "./payloadBuilder";
import {
  receivePoliciesPayload,
  receiveTemplatePayload,
} from "./payloadReceiver";
const BASE_HTTP_URL = "http://localhost:8000";
const BASE_WS_URL = "ws://localhost:8000";

export class SimulationAPI {
  constructor(modelId) {
    if (!modelId) {
      throw new Error("SimulationAPI requires a modelId to be instantiated.");
    }
    this.modelId = modelId;
    this.websocket = null;
    this.messageListeners = new Set();
  }

  // --- Static Methods (don't require a model instance) ---

  /**
   * Attempts to create a readable error depending on what was sent back.
   * @param {*} response - the response from the last request made.
   * @param {*} defaultMessage - the default message if nothing could be obtained.
   * @returns an error with a message.
   */
  static async throwReadableError(response, defaultMessage) {
    let readableError = defaultMessage;

    try {
      const errorData = await response.json();
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
    } catch (e) {}
    throw new Error(readableError);
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
      const backendConfig = await response.json();
      // Transform the backend config into the frontend's `params` format
      return receiveTemplatePayload(backendConfig);
    } else {
      throw await SimulationAPI.throwReadableError(
        response,
        `Failed to fetch configuration for template: ${template}`
      );
    }
  }

  /**
   * @param {object} params - Parameters for the model
   * @returns {Promsise<number>} modelId - The ID of the created model.
   * @throws {Error} If the model creation fails.
   */
  static async createModel(params) {
    const payload = buildCreatePayload(params);
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
      throw await SimulationAPI.throwReadableError(
        response,
        "Failed to create model."
      );
    }
  }

  // --- Instance Methods (require a model instance) ---

  /**
   * Gets the model policies for a given model ID.
   * @param {*} modelId - The ID of the model to fetch policies for.
   * @returns {Promise<object>} policies - The policies associated with the specified model, in a frontend format.
   * @throws {Error} If the fetch fails or the response is not OK.
   */
  async getModelPolicies(modelId = this.modelId) {
    const response = await fetch(`${BASE_HTTP_URL}/models/${modelId}/policies`);

    if (response.status === HTTP_STATUS.OK) {
      const policies = await response.json();
      console.log("Policies received:", policies);
      return receivePoliciesPayload(policies);
    } else {
      throw await SimulationAPI.throwReadableError(
        response,
        `Failed to fetch policies for model ID ${modelId}`
      );
    }
  }

  /**
   * Sets the model policies for a given model ID.
   * @param {Object} policyParams - The policies to set for the model.
   * @param {string} [modelId=this.modelId] - The ID of the model.
   * @throws {Error} If the policies could not be set because the response is not NO_CONTENT.
   */
  async setModelPolicies(policyParams, modelId = this.modelId) {
    const policies = buildPoliciesPayload(policyParams);
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
      throw await SimulationAPI.throwReadableError(
        response,
        `Failed to set policies for model ID ${modelId}`
      );
    }
  }

  /**
   * Retrieves all of the model indicators for a given model ID.
   * @param {number} [startTime=0] - The start time to get indicators for.
   * @param {number} [endTime=0] - The end time to get indicators for (0 means current time).
   * @param {string} [modelId=this.modelId] - The ID of the model.
   * @returns {Object} - the indicator as a list of records.
   * @throws {Error} If the indicators could not be retrieved.
   */
  async getModelIndicators(startTime = 0, endTime = 0, modelId = this.modelId) {
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
      throw await SimulationAPI.throwReadableError(
        response,
        `Failed to fetch indicators for model ID ${modelId}`
      );
    }
  }

  /**
   * Steps 1 time step for a given model ID.
   * @param {string} [modelId=this.modelId] - The ID of the model.
   * @throws {Error} If the model could not be stepped through.
   */
  async stepModel(modelId = this.modelId) {
    const response = await fetch(`${BASE_HTTP_URL}/models/${modelId}/step`, {
      method: "POST",
    });

    if (response.status === HTTP_STATUS.NO_CONTENT) {
      return;
    } else {
      throw await SimulationAPI.throwReadableError(
        response,
        `Failed to step model ID ${modelId}`
      );
    }
  }

  /**
   * Deletes a model for a given model ID.
   * @param {string} [modelId=this.modelId] - The ID of the model.
   * @throws {Error} If the model could not be deleted.
   */
  async deleteModel(modelId = this.modelId) {
    const response = await fetch(`${BASE_HTTP_URL}/models/${modelId}`, {
      method: "DELETE",
    });

    if (response.status === HTTP_STATUS.NO_CONTENT) {
      return;
    } else {
      throw await SimulationAPI.throwReadableError(
        response,
        `Failed to delete model ID ${modelId}`
      );
    }
  }

  // --- WebSocket Methods ---

  /**
   * Connects to the model's WebSocket endpoint.
   * @returns {Promise<void>} A promise that resolves when the connection is open, or rejects on error.
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        console.warn("WebSocket is already connected or connecting.");
        resolve();
        return;
      }

      const url = `${BASE_WS_URL}/models/${this.modelId}`;
      this.websocket = new WebSocket(url);

      this.websocket.onopen = () => {
        console.log(`WebSocket connected to model ${this.modelId}`);
        resolve();
      };

      this.websocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        // Notify all registered listeners
        this.messageListeners.forEach((listener) => {
          listener(message);
        });
      };

      this.websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        reject(error);
      };

      this.websocket.onclose = () => {
        console.log("WebSocket connection closed.");
        this.websocket = null;
      };
    });
  }

  /**
   * Registers a callback function to be executed when a WebSocket message is received.
   * @param {function} callback - The function to call with the message data.
   */
  addMessageListener(callback) {
    this.messageListeners.add(callback);
  }

  /**
   * Unregisters a callback function.
   * @param {function} callback - The function to remove from the listeners.
   */
  removeMessageListener(callback) {
    this.messageListeners.delete(callback);
  }

  /**
   * Sends a JSON message through the WebSocket.
   * @param {object} message - The message object to send (e.g., { action: "step" }).
   */
  sendMessage(message) {
    if (!this.websocket || this.websocket.readyState === WebSocket.CLOSED) {
      console.error("WebSocket is not connected. Cannot send message.");
      return;
    }

    if (this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    } else if (this.websocket.readyState === WebSocket.CONNECTING) {
      // Queue the message to be sent once the connection is open
      console.log("WebSocket is connecting. Queuing message:", message);
      this.websocket.addEventListener("open", () => this.sendMessage(message), {
        once: true,
      });
    }
  }

  /**
   * Sends a message through the WebSocket to get the current week.
   */
  getCurrentWeek() {
    this.sendMessage({ action: "get_current_week" });
  }

  setPolicies(policyParams) {
    this.sendMessage({
      action: "set_policies",
      data: buildPoliciesPayload(policyParams),
    });
  }

  /**
   * Closes the WebSocket connection if it is open.
   */
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }
}
