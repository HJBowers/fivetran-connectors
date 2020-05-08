![](https://static.slab.com/prod/uploads/ds8zyc5n/posts/images/4k3gGePqOWSqOX3DibKLJ4bV.png)

# Fivetran
## Intro
Fivetran cloud function connectors enables the DIY capabilities for our customers to work with sources for which the connectors are not prebuilt by Fivetran yet. For further details on functions please feel free to read: https://fivetran.com/docs/functions. Here we will focus primarily on Google Cloud Functions.

## Functions
### How Functions work?

There is a very good [article](https://medium.com/@iromin/google-cloud-functions-tutorial-what-is-google-cloud-functions-8796fa07fc7a) explaining the architecture, use-case, etc. 

## Fivetran Google Cloud Function Implementation
```
Note: Please read through the entire article prior to writing/testing a google cloud function.
```

### Prerequisite
Setup of account/services will be required for each stage of the process.

### Definitions and key terminology

**E**xtract - source related info (DB, API, IP Whitelisting)  
**T**ransform - Fivetran related info (account, connector)  
**L**oad - destination related info (DWH, IP Whitelisting)  

**Source**
  - REST API Schema definitions (layout)
  - API access credentials (developer)
  - Common HTTP responses (coding, limits, etc)

**Destination**
  - DWH Account
  - IP Whitelisting

**Function**
  - Framework of your choice (NodeJS, Python, Go, etc)
  - Executable (the function/handler/etc)

**Fivetran**
  - Fivetran connector
  - Connected Warehouse
  - Connector setup
      - schema
      - secrets
      - trigger function url

## GCP & Fivetran Data flow

**Fivetran**
- using a service-account to trigger your function on GCP

**Google Cloud Functions**
- authenticate the service-account triggering the function
- execute your code (function)

**Function (your code)**
- authenticate against the source
- query
- extract
- structure the response (formatting)
- return formatted response
    - schema
    - primary keys
    - saved (last) state
    - payload

**Fivetran**
- capture the returned (formatted response)
- insert / update / delete based on the response payload/structure
- deduplication/sorting/casting/etc
- push data to DWH

**Fivetran** (additional steps)
- hasMore? (is there a need to run again?)

# Fivetran Google Cloud Platform Connector Setup

## Steps required on GCP

- [create, deploy and test a function](https://cloud.google.com/functions/docs/quickstart-console)
- [additional docs](https://cloud.google.com/functions/docs)

## Steps required on Fivetran

Following our docs, you'll have to provide the following information:
- Destination Schema
- Function Trigger (url)
- Secrets (a JSON object that contains all of your secrets)
> detailed notes in the provided solution (ZIP archive)

# Important Notes
Some `best practices` based on my recent experience
```
Following these will save you hours of your preciouse time troubleshooting this setup.
```

## GCP
- use a static (hard coded) response (in your function) in order to test Fivetran's authentication/connectivity/functionality
- verify and validate your code's functionality outside of Fivetran's ecosystem (basic sanity tests)
- keep a local (and consistent) JSON payload for your tests, and test after every code change. (it should always work/be successful)
- highly recommended to output (verbose logging) to console while working on your first function (while debugging)
- changes to function (even after a successful deploy) might take few seconds (or minutes) to properly propagate (deploy time) over all GCP infrastructure.
- pay close attention to your test payload, is should contain a `secrets` key with your secrets as sub-keys/values.

```js
/**
 * TEST #1
 * - payload for your GCP function TEST
 * - multiple `secrets` children in your payload
 * - providing `state`
 * */
{
  task: "run",
  env: "prod",
  agent : "<function_connector_name>/<external_id>/<schema>",
  state: {
      cursor: "2018-01-01T00:00:00Z"
  },
  secrets: {
    okta: {
      apiKey: "sjhgujagsdufygksajdf"
    },
    eDX: {
      apiKey: "uurmn73g728!bkjbkj"
    }
  }
}

/**
 * TEST #2
 * - payload for your GCP function TEST
 * - single `secrets` child in your payload
 * - `state` is not provided
 * */
{
  task: "run",
  env: "prod",
  agent : "<function_connector_name>/<external_id>/<schema>",
  secrets: {
    apiKey: "sjhgujagsdufygksajdf"
  }
}
```

## Fivetran

- setup form, `secrets` field, it&#39;s important to know that we will
    - wrap your JSON object with `secrets` key
    - your `secrets` must be a JSON object, and `spread over 1-line`

```js
/**
 * SECRETS #1
 * - multiple `secrets` children
 */
{okta: {apiKey: "sjhgujagsdufygksajdf"},eDX:{apiKey: "uurmn73g728!bkjbkj"}}

/**
 * SECRETS #1
 * - only 1 `secrets` child
 */
{apiKey: "sjhgujagsdufygksajdf"}
```

> make sure to provide our `service-account` the proper permissions to execute/trigger the function or you'll receive `HTTP 401 unauthorized`


# Attachments

- complete working example [fivetran-google-cloud-function.zip](../resources/fivetran-google-cloud-function.zip)

# Additional Resources

## GCP

- [calling cloud functions](https://cloud.google.com/functions/docs/calling)

## Fivetran

- [Cloud Functions](https://fivetran.com/docs/functions#functions)
