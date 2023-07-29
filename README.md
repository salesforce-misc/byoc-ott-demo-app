# BYOC Inbound/Outbound Message demo app
This interactive demo app is designed to help you test the features of inbound/outbound messaging and attachment for inbound message after your custom channel messaging configuration is done. It also allows you to customize the settings of "CCD API Name", "Conversation Address Identifier", and "End User Client Identifier" to test different custom channels, conversations, and end users.

## Setup

```
$ git clone https://git.soma.salesforce.com/BYOC/byoc-ott-demo-app.git
$ cd byoc-ott-demo-app
$ cp .env.example .env
$ vi .env (Replace all place holder vars marked inside <> accordingly shown as next section Configuration)
$ npm install
$ node . (Start the app server)

Then open browser and load url: http://localhost:3000/
```

## Salesforce Core Setup

- Create a [Connected App](https://git.soma.salesforce.com/service-cloud-realtime/scrt2-interaction-service/blob/master/CONNECTED_APP.md).
- In the connected app setup above, get private key and connected app consumer key which will be set in the configuration shown below.

## Configuration
Add the following config vars to the .env file.

```
SF_CONSUMER_KEY="<connected app consumer key>"
SF_PRIVATE_KEY="<private key>"
SF_AUDIENCE=https://login.salesforce.com
SF_SUBJECT=<admin user name>
SF_AUTH_ENDPOINT=https://login.salesforce.com/services/oauth2/token
SF_PUB_SUB_ENDPOINT=api.pubsub.salesforce.com:7443
SF_PUB_SUB_TOPIC_NAME=<API Name of the custom platform event>
SF_PUB_SUB_CUSTOM_EVENT_CHANNEL_ADDRESS_ID_FIELD=<API name of the custom ChannelAddressIdentifier field>
SF_PUB_SUB_CUSTOM_EVENT_PAYLOAD_FIELD=<API name of the custom Payload field>
SF_PUB_SUB_CUSTOM_EVENT_RECIPIENT_FIELD=<API name of the custom Recipient field>
SF_PUB_SUB_EVENT_RECEIVE_LIMIT=100
SF_INSTANCE_URL=<Salesforce core app instance url>
SF_SCRT_INSTANCE_URL=<Salesforce core app scrt2 instance url>
SF_ORG_ID=<orgId>
SF_AUTHORIZATION_CONTEXT=<ConversationChannelDefinition API Name>
CONVERSATION_ADDRESS_IDENTIFIER=<Conversation address identifier>
END_USER_CLIENT_IDENTIFIER=<End user client identifier>
PORT=3000
```

## Instructions for using demo app
- TBA

## Notes
- TBA
