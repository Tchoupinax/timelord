import {
  boolean,
  number,
  optional,
  string,
  validate,
  type Validator,
} from "valienv";

const stringWithDefault =
  (defaultValue: string): Validator<string> =>
  value =>
    string(value) ?? defaultValue;

const booleanWithDefault =
  (defaultValue: boolean): Validator<boolean> =>
  value =>
    boolean(value) ?? defaultValue;

const fake = {
  API_URL: "test_fake",
  CI_COMMIT_SHA: "test_fake",
  CI_PIPELINE_CREATED: new Date().getTime().toString(),
  JOB_DEFAULT_TIMEOUT: "1h",

  OIDC_CLIENT_ID: "test_fake",
  OIDC_CLIENT_SECRET: "test_fake",
  OIDC_PROVIDER_NAME: "Authelia",

  PORT: "18888",
  SSH_KEYS_REPOSITORY: "tmp",
  UI_URL: "test_fake",
  VAULT_ADDR: "http://localhost:8200",
  VAULT_PATH: "kv/data/timelord",
  VAULT_TOKEN: "root",
};

export const env = validate({
  env: process.env.NODE_ENV === "test" ? fake : process.env,
  validators: {
    API_URL: string,
    CI_COMMIT_SHA: string,
    CI_PIPELINE_CREATED: number,
    DISABLE_AUTHENTICATION: booleanWithDefault(false),
    GIT_CONFIGS_REPOSITORY: stringWithDefault("/tmp"),
    DATABASE_URL: string,
    JOB_DEFAULT_TIMEOUT: string,

    OIDC_CLIENT_ID:
      process.env.DISABLE_AUTHENTICATION === "true" ? optional(string) : string,
    OIDC_CLIENT_SECRET:
      process.env.DISABLE_AUTHENTICATION === "true" ? optional(string) : string,
    OIDC_PROVIDER_NAME:
      process.env.DISABLE_AUTHENTICATION === "true" ? optional(string) : string,
    OIDC_PROVIDER_IMAGE:
      process.env.DISABLE_AUTHENTICATION === "true" ? optional(string) : string,
    OIDC_CONFIGURATION_URL:
      process.env.DISABLE_AUTHENTICATION === "true" ? optional(string) : string,

    POSTGRES_USERNAME: string,
    POSTGRES_PASSWORD: string,
    POSTGRES_HOSTNAME: string,
    POSTGRES_PORT: number,
    POSTGRES_DATABASE: string,

    PORT: optional(number),
    SSH_KEYS_REPOSITORY: stringWithDefault("/tmp"),
    UI_URL: string,
    VAULT_ADDR: string,
    VAULT_PATH: string,
    VAULT_TOKEN: string,
  },
});
