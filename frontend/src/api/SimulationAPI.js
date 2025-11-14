// frontend/src/api/SimulationAPI.js
import { HTTP_STATUS } from "./httpCodes";
import { buildPoliciesPayload, buildCreatePayload } from "./payloadBuilder";
import {
  receivePoliciesPayload,
  receiveTemplatePayload,
} from "./payloadReceiver";

const BASE_HTTP_URL = "http://localhost:8000";
const BASE_WS_URL = "ws://localhost:8000";

/**
 * Thin client for our simulation backend.
 * - REST methods (fetch): create/read/update resources
 * - WebSocket methods: push-style interactions (step, get_current_week, set_policies)
 */
export class SimulationAPI {
  constructor(modelId) {
    if (!modelId) {
      throw new Error("SimulationAPI requires a modelId to be instantiated.");
    }
    /** @type {number|string} The model identifier used in all calls. */
    this.modelId = modelId;

    /** @type {WebSocket|null} Active WS connection, if any. */
    this.websocket = null;

    /** @type {Set<Function>} WS message subscribers. Each gets parsed JSON messages. */
    this.messageListeners = new Set();

    /** @type {Array<object>} Messages queued while WS is CONNECTING. */
    this.messageQueue = [];
  }

  /* ------------------------------------------------------------------
   * Helpers
   * ------------------------------------------------------------------ */

  /** Try to parse JSON from a Response's body; return undefined if it isn't JSON. */
  static async tryParseJson(response) {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return undefined;
    }
  }

  /**
   * Create a friendly Error from a failed fetch `Response`.
   * - Supports FastAPI/Pydantic 422: detail: [{ loc, msg, ... }]
   * - Supports { detail: "..." } or object detail
   * - Falls back to server text or the provided default
   */
  static async throwReadableError(response, defaultMessage) {
    let readable = defaultMessage;
    try {
      // Try the standard JSON path first; if it fails, try best-effort parsing.
      const data = await response.clone().json().catch(async () => {
        return await SimulationAPI.tryParseJson(response);
      });

      if (data && data.detail) {
        if (Array.isArray(data.detail) && data.detail.length > 0) {
          // Typical Pydantic validation error format
          const first = data.detail[0];
          const field =
            Array.isArray(first.loc) && first.loc.length > 1
              ? first.loc.slice(1).join(" > ")
              : "field";
          const msg = first.msg || JSON.stringify(first);
          readable = `Invalid field '${field}': ${msg}`;
        } else if (typeof data.detail === "string") {
          readable = data.detail;
        } else if (typeof data.detail === "object") {
          readable = JSON.stringify(data.detail);
        }
      } else if (data && data.message) {
        readable = data.message;
      } else {
        // If body isn't JSON, surface the plain text if present
        const text = await response.clone().text();
        if (text && text.trim().length > 0) readable = text.trim();
      }
    } catch {
      // Keep default message on any parsing failure
    }
    throw new Error(readable);
  }

  /* ------------------------------------------------------------------
   * Static REST (no instance required)
   * ------------------------------------------------------------------ */

  /**
   * Fetch a template config and convert it to the frontend `params` shape.
   * @returns {Promise<object>} SetupPage-compatible params object
   */
  static async getTemplateConfig(template) {
    const response = await fetch(`${BASE_HTTP_URL}/templates/${template}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (response.status === HTTP_STATUS.OK) {
      const backendConfig = await response.json();
      return receiveTemplatePayload(backendConfig);
    }
    throw await SimulationAPI.throwReadableError(
      response,
      `Failed to fetch configuration for template: ${template}`
    );
  }

  /**
   * Create a model using the SetupPage `params` tree.
   * @returns {Promise<number|string>} modelId (whatever backend returns)
   */
  static async createModel(params) {
    const payload = buildCreatePayload(params);
    const response = await fetch(`${BASE_HTTP_URL}/models/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.status === HTTP_STATUS.CREATED) {
      // Backend is expected to return the raw model id (number/string)
      const modelId = await response.json();
      return modelId;
    }
    throw await SimulationAPI.throwReadableError(response, "Failed to create model.");
  }

  /* ------------------------------------------------------------------
   * Instance REST (uses this.modelId)
   * ------------------------------------------------------------------ */

  /**
   * Get current model policies and convert to UI `policyParams` shape.
   */
  async getModelPolicies(modelId = this.modelId) {
    const response = await fetch(`${BASE_HTTP_URL}/models/${modelId}/policies`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (response.status === HTTP_STATUS.OK) {
      const policies = await response.json();
      return receivePoliciesPayload(policies);
    }
    throw await SimulationAPI.throwReadableError(
      response,
      `Failed to fetch policies for model ID ${modelId}`
    );
  }

  /**
   * Set model policies (accepts UI `policyParams`, converts to backend payload).
   */
  async setModelPolicies(policyParams, modelId = this.modelId) {
    const policies = buildPoliciesPayload(policyParams);
    const response = await fetch(`${BASE_HTTP_URL}/models/${modelId}/policies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(policies),
    });

    if (response.status === HTTP_STATUS.NO_CONTENT) return;
    throw await SimulationAPI.throwReadableError(
      response,
      `Failed to set policies for model ID ${modelId}`
    );
  }

  /**
   * Get indicators over a time range.
   * - `endTime = 0` typically means "up to current week" (per backend contract).
   */
  async getModelIndicators(startTime = 0, endTime = 0, modelId = this.modelId) {
    const url = new URL(`${BASE_HTTP_URL}/models/${modelId}/indicators`);
    url.searchParams.append("start_time", startTime);
    url.searchParams.append("end_time", endTime);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (response.status === HTTP_STATUS.OK) {
      return await response.json();
    }
    throw await SimulationAPI.throwReadableError(
      response,
      `Failed to fetch indicators for model ID ${modelId}`
    );
  }

  /**
   * Advance the model by one time step.
   */
  async stepModel(modelId = this.modelId) {
    const response = await fetch(`${BASE_HTTP_URL}/models/${modelId}/step`, {
      method: "POST",
    });

    if (response.status === HTTP_STATUS.NO_CONTENT) return;
    throw await SimulationAPI.throwReadableError(
      response,
      `Failed to step model ID ${modelId}`
    );
  }

  /**
   * Delete the model.
   */
  async deleteModel(modelId = this.modelId) {
    const response = await fetch(`${BASE_HTTP_URL}/models/${modelId}`, {
      method: "DELETE",
    });

    if (response.status === HTTP_STATUS.NO_CONTENT) return;
    throw await SimulationAPI.throwReadableError(
      response,
      `Failed to delete model ID ${modelId}`
    );
  }

  /* ------------------------------------------------------------------
   * WebSocket
   * ------------------------------------------------------------------ */

  /**
   * Open a WS connection for this model.
   * - Outbound messages are queued until the socket is OPEN.
   * - Call `addMessageListener(fn)` to receive parsed JSON messages.
   * @returns {Promise<void>}
   */
  connect() {
    return new Promise((resolve, reject) => {
      // If already OPEN, resolve immediately
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      const url = `${BASE_WS_URL}/models/${this.modelId}`;
      this.websocket = new WebSocket(url);

      this.websocket.onopen = () => {
        // Flush any messages queued during CONNECTING
        this.processMessageQueue();
        resolve();
      };

      this.websocket.onmessage = (event) => {
        // Defensive parse: ignore malformed frames
        try {
          const message = JSON.parse(event.data);
          this.messageListeners.forEach((listener) => listener(message));
        } catch {
          // ignore bad WS payloads
        }
      };

      this.websocket.onerror = (error) => {
        // Surface connection errors to the caller
        reject(error);
      };

      this.websocket.onclose = () => {
        // Drop the ref; callers may choose to reconnect
        this.websocket = null;
      };
    });
  }

  /** Send all messages that were queued while CONNECTING. */
  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      this.sendMessage(this.messageQueue.shift());
    }
  }

  /** Subscribe to WS messages (parsed JSON). */
  addMessageListener(callback) {
    this.messageListeners.add(callback);
  }

  /** Unsubscribe from WS messages. */
  removeMessageListener(callback) {
    this.messageListeners.delete(callback);
  }

  /**
   * Send a JSON-serializable object over WS.
   * - If OPEN: send immediately.
   * - If CONNECTING: queue.
   * - If CLOSED/absent: log and drop (call `connect()` first).
   */
  sendMessage(message) {
    if (!this.websocket || this.websocket.readyState === WebSocket.CLOSED) {
      console.error("WebSocket is not connected. Cannot send message.");
      return;
    }
    if (this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    } else if (this.websocket.readyState === WebSocket.CONNECTING) {
      this.messageQueue.push(message);
    }
  }

  /** Ask backend (via WS) for the current simulation week. */
  getCurrentWeek() {
    this.sendMessage({ action: "get_current_week" });
  }

  /**
   * Push policies over WS.
   * Uses the same payload shape as REST (decimals + label keys).
   */
  setPolicies(policyParams) {
    this.sendMessage({
      action: "set_policies",
      data: buildPoliciesPayload(policyParams),
    });
  }

  /** Close the WS connection, if any. */
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }
}
