import { HTTP_STATUS } from "./httpCodes";
import { buildPoliciesPayload, buildCreatePayload } from "./payloadBuilder";
import { receiveTemplatePayload } from "./payloadReceiver";
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
    this.messageQueue = []; // Queue for messages sent before connection is open
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
      const param = receiveTemplatePayload(backendConfig);
      console.log("Template config received:", param);
      return param;
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
    console.log("Simulation parameters/payload:", payload);
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
        this.processMessageQueue();
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
   * Processes and sends any messages that were queued while the WebSocket was connecting.
   */
  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      this.sendMessage(this.messageQueue.shift());
    }
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
      console.log("WebSocket is connecting. Queuing message:", message);
      this.messageQueue.push(message);
    }
  }

  /**
   * Sends a message through the WebSocket to step the simulation.
   */
  step() {
    this.sendMessage({ action: "step" });
  }

  /**
   * Sends a message through the WebSocket to reverse the simulation.
   */
  reverseStep() {
    this.sendMessage({ action: "reverse_step" });
  }

  /**
   * Sends a message through the WebSocket to get the current week.
   */
  getCurrentWeek() {
    this.sendMessage({ action: "get_current_week" });
  }

  /**
   * Sends a message through the WebSocket to get the industry metrics.
   */
  getIndustryData() {
    this.sendMessage({ action: "get_industry_data" });
  }

  /**
   * Sends a message through the WebSocket to get the industry metrics for the current week.
   */
  getCurrentIndustryData() {
    this.sendMessage({ action: "get_current_industry_data" });
  }

  /**
   * Sends a message through the WebSocket to get the demographic metrics.
   */
  getDemoMetrics() {
    this.sendMessage({ action: "get_demo_metrics" });
  }

  /**
   * Sends a message through the WebSocket to get the demographic metrics for the current week.
   */
  getCurrentDemoMetrics() {
    this.sendMessage({ action: "get_current_demo_metrics" });
  }

  /**
   * Sends a message through the WebSocket to get the economic indicators.
   */
  getIndicators() {
    this.sendMessage({ action: "get_indicators" });
  }

  /**
   * Sends a message through the WebSocket to get the current week.
   */
  getPolicies() {
    this.sendMessage({ action: "get_policies" });
  }

  /**
   * Sends a message through the WebSocket to set the policies.
   * @param {*} policyParams the new policies to set.
   */
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
