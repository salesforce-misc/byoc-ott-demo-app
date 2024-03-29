# BYOC Inbound/Outbound Message demo app
This interactive demo app is designed to help you test the features of inbound/outbound messaging and attachment for inbound messages after your custom channel messaging configuration is done. It also allows you to customize the settings of "Conversation Channel Definition API Name", "Channel Address Identifier", "End User Client Identifier", "Custom Event Channel Address Id Field", "Custom Event Payload Field", and "Custom Event Recipient Field" to test different custom channels, conversations, and end users.

## Setup

```
$ git clone https://github.com/salesforce-misc/byoc-ott-demo-app.git
$ cd byoc-ott-demo-app
$ cp .env.example .env
$ vi .env (Replace all placeholder vars marked inside <> accordingly shown as next section Configuration)
$ npm install
$ node . (Start the app server)

Then open browser and load the url: http://localhost:3000
```

## Salesforce Core Setup

The Interaction Service requires an oAuth AccessToken generated by digital cert signed JWT using a Core Connected App.

### Setup

When setting up a Connected App there are a few things that need to be specified for the integration to work:

- `Enable OAuth Settings`
- Callback URL can be anything, recommend just using `https://salesforce.com` for now
- `Use digital signature` (see below for generating cert)
- Select these OAuth scopes:
  - `Access Interaction API resources (interaction_api)`
  - `Perform Requests at any time (refresh_token, offline_access)`
- Enable `Opt in to issue JSON Web Token (JWT)-based access tokens for named users`
- Save the app
- From your Connected App, click `Manage` -> `Edit Policy`
  - `Permitted Users` -> `Admin approved users are pre-authorized`
- `Manage Profiles` -> `System Administrators`

#### Generate Connected App Cert

To generate a self-signed cert locally:

```bash
openssl genrsa -des3 -passout pass:password -out server.pass.key 2048;
openssl rsa -passin pass:password -in server.pass.key -out server.key;
openssl req -new -key server.key -out server.csr;
openssl x509 -req -sha256 -days 365 -in server.csr -signkey server.key -out server.crt;
```

`server.crt` is your public-certificate and `server.key` is your private key.

#### Generate AccessToken

The Integration Service requires an AccessToken generated using
the [Oauth 2.0 JWT Bearer Flow](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_jwt_flow.htm&type=5)

To generate a signed JWT you can use a tool such as [JWT.io](https://jwt.io/)

- In the header set the `alg` to `RS256` (required by SFDC)
- In the payload set:
  - `iss` - your Connected Apps Consumer Key
    - This can be found from the Connected Apps page by clicking the Manager Consumer Details button
  - `sub` - the username of the salesforce user account.
  - `aud` - Set depending on the env
    - local: `https://<local machine url>:6101`
    - test:  `https://login.stmfa.stm.salesforce.com` or `https://login.stmfb.stm.salesforce.com`
    - prod: `https://login.salesforce.com`
  - `exp` - timestamp in MS when the token expires. For local dev and testing set this way in the future to avoid having to regenerate a token
- In the signature past in your public and private key of the cert associated with the Connected App

Use the created JWT to generate an AccessToken

Assuming localhost:

```bash
curl --location --request POST -v https://localhost:6101/services/oauth2/token --header 'Content-Type: application/x-www-form-urlencoded' --data-urlencode "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer" --data-urlencode "assertion=<JWT>>"
```

From the response copy the `access_token` which can be used to make requests to the Interaction Service. The token should be in the format:

```bash
<orgId>!<token>
```
In the connected app setup above, get the connected app consumer key and private key which will be set as values for keys SF_CONSUMER_KEY and SF_PRIVATE_KEY respectively in the configuration shown below.

## Configuration
Add the following config vars to the .env file.

```
SF_CONSUMER_KEY="<connected app consumer key>"
SF_PRIVATE_KEY="<private key>"
SF_AUDIENCE=https://login.salesforce.com [^1]
SF_SUBJECT=<admin user name>
SF_AUTH_ENDPOINT=https://login.salesforce.com/services/oauth2/token [^2]
SF_PUB_SUB_ENDPOINT=api.pubsub.salesforce.com:7443 [^3]
SF_PUB_SUB_TOPIC_NAME=/event/<API Name of the custom platform event>
SF_PUB_SUB_CUSTOM_EVENT_CHANNEL_ADDRESS_ID_FIELD=<API name of the custom ChannelAddressIdentifier field>
SF_PUB_SUB_CUSTOM_EVENT_PAYLOAD_FIELD=<API name of the custom Payload field>
SF_PUB_SUB_CUSTOM_EVENT_RECIPIENT_FIELD=<API name of the custom Recipient field>
SF_PUB_SUB_EVENT_RECEIVE_LIMIT=100
SF_INSTANCE_URL=<Salesforce core app instance url> [^4]
SF_SCRT_INSTANCE_URL=<Salesforce core app scrt2 instance url> [^5]
SF_ORG_ID=<orgId>
SF_AUTHORIZATION_CONTEXT=<ConversationChannelDefinition API Name>
CHANNEL_ADDRESS_IDENTIFIER=<Channel address identifier> [^6]
END_USER_CLIENT_IDENTIFIER=<End user client identifier>
PORT=3000
```

**Note**: 
- [^1] The audience url for different environments:
  - Salesforce internal dev instance: `https://login.test1.pc-rnd.salesforce.com`
  - Sandbox instance: `https://test.salesforce.com`
  - Prod instance: `https://login.salesforce.com`
- [^2] The auth endpoint for different environments:
  - Salesforce internal dev instance: `https://login.test1.pc-rnd.salesforce.com/services/oauth2/token`
  - Sandbox instance: `https://test.salesforce.com/services/oauth2/token`
  - Prod instance: `https://login.salesforce.com/services/oauth2/token`
- [^3] The Pub/Sub endpoint for different environments:
  - Salesforce internal dev instance: `api.stage.pubsub.salesforce.com:7443`
  - Sandbox instance: `api.pubsub.salesforce.com:7443`
  - Prod instance: `api.pubsub.salesforce.com:7443`
- [^4] The value of \<Salesforce core app instance url\> above is an url with the pattern of "https://\<your org my domain name\>.my.salesforce.com".
- [^5] The value of \<Salesforce core app scrt2 instance url\> above is an url with the pattern of "https://\<your org my domain name\>.my.salesforce-scrt.com".
- [^6] The value of \<Channel address identifier\> above is the value from field "ChannelAddressIdentifier" in corresponding MessagingChannel record.

## Instructions for using demo app
After load the url: http://localhost:3000 in browser, the demo app page is displayed with two parts: "Demo Settings" on left hand side and "Messaging component" on right hand side.

In "Demo Settings" part, you can change values for fields and click the Update button to apply updated settings to test different custom channels, conversations, and end users.

In "Messaging component" part, enter a message string in the edit box, click Send button to send inbound messages. You can also click the Choose File button to select a file attached to the message. If all settings are configured properly in the Salesforce app, you should get an inbound message or message with attachment in the Messaging Session record detail page in the Salesforce app.

## Additional Notes
Use of the code in this repository with Salesforce products or services should be used in accordance with any applicable developers guides on [developer.salesforce.com](https://developer.salesforce.com/) and may be subject to additional terms of use, including but not limited to the [Salesforce Program Agreement - Program Terms for the Salesforce Developers Program](https://www.salesforce.com/company/program-agreement/#devs).
