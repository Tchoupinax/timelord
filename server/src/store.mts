import { AsyncLocalStorage } from "node:async_hooks";
import { requestContext } from "@fastify/request-context";

export type Store = StoreHuman | StoreRobot | StoreUnknown;

type StoreUnknown = {
  isHuman: false;
  isRobot: false;
};

type StoreHuman = {
  isHuman: true;
  isRobot: false;
  userId: string;
};

type StoreRobot = {
  agentHostname: string;
  agentName: string;
  isHuman: false;
  isRobot: true;
  userId: string;
};

export const asyncLocalStorage = new AsyncLocalStorage<Store>();

export class StoreUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoreUnavailableError";
  }
}

export function getMiddlewareStore(): Store {
  return asyncLocalStorage.getStore()!;
}

export function getHumanStore(): StoreHuman {
  const store = requestContext.get("store");
  if (store && store.isHuman) {
    return store;
  }

  throw new StoreUnavailableError(
    "This store is not available here because user is not an human.",
  );
}

export function getRobotStore(): StoreRobot {
  const store = requestContext.get("store");
  if (store && store.isRobot) {
    return store;
  }

  throw new StoreUnavailableError(
    "This store is not available here because user is not a robot.",
  );
}
