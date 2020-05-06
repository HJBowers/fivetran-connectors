//@ts-check

const https = require('https');

/**
 * RELATED DOCS/LINKS
 * - https://fivetran.com/docs/functions/google-cloud-functions/sample-functions
 * - https://github.com/fivetran/functions/tree/master/twitter/google_cloud
 */

/**
 * Okta
 * - using 'apiKey' from Fivetran 'secrets' object (provided to Fivetran in the setup form)
 */
let myOkta = {
  hostname: 'fivetraneappoc-admin.oktapreview.com',
  paths: {
    users: '/api/v1/users?limit=1000',
    logs: '/api/v1/logs',
  }
};

/**
 * Docs
 * - https://github.com/fivetran/functions/tree/master/twitter/google_cloud
 */

/**
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
exports.handler = (req, res) => {

  /**
   * DEBUG
   * - identify the source/trigger
   */
  console.log("GCP Fivetran V0.1");
  console.log("req.body", req.body);

  /**
   * locate the apiKey
   */
  if (req.body.secrets === undefined) {
    // res.status(400).send('No secrets is defined!');
    res.header("Content-Type", "application/json");
    res.status(403).send({
      error: 403,
      reason: 'No secrets is defined!',
      message: "You shell not pass!!!"
    });
  }
  if (req.body.secrets.apiKey === undefined) {
    // res.status(400).send('No apiKey is defined!');
    res.header("Content-Type", "application/json");
    res.status(403).send({
      error: 403,
      reason: 'No apiKey is defined!',
      message: "You shell not pass!!!"
    });
  }

  // secrets & apiKey were provided  
  console.log('...INFO: apiKey provided...');
  myOkta.auth = {
    apiKey: req.body.secrets.apiKey
  };

  /**
   * FUNCTIONS
   * - for example porpose, a function per endpoint
   */
  // getUsersAuth(myOkta)
  getLogsAuth(myOkta)

  /**
   * getUserswithAuth
   * - get Users after Authentication
   * @param {*} myOkta 
   */
  function getUsersAuth(myOkta) {
    var path = myOkta.paths.users;
    console.log('...authenticated, now fetching /users...');
    console.log('path', path);

    /**
     * Get all users
     * - https://developer.okta.com/docs/reference/api/users/#list-all-users
     */
    let get = https.get({
      hostname: myOkta.hostname,
      path: path,
      headers: {
        'Authorization': 'SSWS ' + myOkta.auth.apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    }, getRes => {
      var reply = '';
      getRes.on('data', chunk => reply += chunk);
      getRes.on('end', () => withUsers(reply));
    });
  }

  /**
   * getLogswithAuth
   * - get Logs after Authentication
   * @param {*} myOkta 
   */
  function getLogsAuth(myOkta) {
    var path = myOkta.paths.logs;
    console.log('...authenticated, now fetching /logs...');
    console.log('path', path);

    /**
     * Get logs
     */
    let get = https.get({
      hostname: myOkta.hostname,
      path: path,
      headers: {
        'Authorization': 'SSWS ' + myOkta.auth.apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    }, getRes => {
      var reply = '';
      getRes.on('data', chunk => reply += chunk);
      getRes.on('end', () => withLogs(reply));
    });
  }

  /**
   * withUsers
   * @param {*} users 
   * - users: response from querying the 'users' fromOkta's endpoint
   * - formatting the ('users' object) response (if needed)
   * - getting/setting the state for the 'users' table
   * - structuring the final response
   * - providing the data to Fivetran in the response
   */
  function withUsers(users) {
    /**
     * DEBUG
     */
    console.log('users', users);
    let jsonUsers = JSON.parse(users);
    // console.log('jsonUsers', jsonUsers);
    console.log(`...got ${jsonUsers.length} users, sending to Fivetran.`);

    var path = myOkta.paths.users;

    // Reformat Oktas's response into nice, flat tables (if needed)
    // Don't worry about duplication--Fivetran will take care of this for us
    let formattedResponse = {

      /**
       * state
       * - users
       */
      state: {
        users: "2018-01-02T00:00:01Z" // should be defined by you, based on the query/response from your REST API Service Provider.
      },
      // Fivetran will use these primary keys to perform a `merge` operation,
      // so even if we send the same row twice, we'll only get one copy in the warehouse
      schema: {
        users: {
          primary_key: ['id']
        }
      },
      // Insert these rows into my warehouse
      insert: {
        users: jsonUsers
      },
      // If this is true, Fivetran will immediately call this function back for more data
      // This is useful to page through large collections
      hasMore: false
    };

    // Send JSON response back to Fivetran
    res.header("Content-Type", "application/json");
    res.status(200).send(formattedResponse);
  }

  function withLogs(data) {
    let hasMoreInfo = data.next
    console.log('data', data);
    let jsonData = JSON.parse(data);
    console.log(`...got ${jsonData.length} records, sending to Fivetran.`);

    /**
     * Reformatting 'logs' since there's no distinct 'id'
     * - we can also use the field 'uuid'
     */
    // let logs = [];
    // for (let index in jsonData) {
    //   let log = jsonData[index];
    //   log.id = log.transaction.id;
    //   console.log(log.id, log);
    //   // logs.push(log);
    //   logs[index] = log;
    // }

    let formattedResponse = {
      state: {
        logs: "2018-01-02T00:00:01Z"
      },
      schema: {
        logs: {
          primary_key: ['uuid']
        }
      },
      insert: {
        logs: jsonData
      },
      hasMore: false
    };

    res.header("Content-Type", "application/json");
    res.status(200).send(formattedResponse);
  }


}
