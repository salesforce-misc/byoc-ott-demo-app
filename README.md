# BYO-OTT Inbound/Outbound Message Demo App
The interactive BYO-OTT Inbound/Outbound Message Demo app is designed to help you test your custom messaging channel configuration.

Use the demo app to test the features of inbound/outbound messaging using a mix of settings to test different custom channels, conversations, and end users.

Before you set up the demo app, complete the steps in the BYO-OTT Channel Setup Guide to set up the custom messaging channel. After you've completed the steps in the guide, set up the demo app by cloning this repo, configuring the `.env` file, and starting the app.

## Set up the BYO-OTT Channel

Before you set up the demo app, complete the steps in the BYO-OTT Channel Setup Guide.
* As you complete the setup steps in the guide, copy the following information, which you'll need to configure the .env file later on.
* Get the location of the private key (server.key). SF_CONSUMER_KEY is set to this value.
* After you create the interaction service connected app, get the consumer key. SF_PRIVATE_KEY is set to this value.
* When you create the custom platform event, get the following API names:
    * The custom platform event. For example, devorg__TestEvent__e.
    * The custom ChannelAddressId field. For example, devorg__TestEvent__e. devorg__ChannelAddrId__c.
    * The custom Payload field. For example, devorg__TestEvent__e.devorg__Payload__c.
    * The custom Recipient field. For example, devorg__TestEvent__e.devorg__Recipient__c.
* When you create the ConversationChannelDefinition record, get the API name (developerName) of the record.

## Set up the Demo App

Set up the BYO-OTT Inbound/Outbound Message Demo app after you've completed the steps in the BYO-OTT Channel Setup Guide.

To set up the demo app, run the following commands to clone this repo, configure the .env file, and start the app.

1. Clone the repo and create a copy of the `.env` file.

   ```
   $ git clone https://git.soma.salesforce.com/BYOC/byoc-ott-demo-app.git
   $ cd byoc-ott-demo-app
   $ cp .env.example .env
   ```
2. Run the following command to edit the `.env` file, and add the environment variables listed in the [Environment Variable Settings](#environment-variable-settings) to the file, replacing all placeholder variables marked inside <> with the appropriate values.

   ```
   $ vi .env
   ```
1. Install the package and start the app server:

   ```
   $ npm install
   $ node .
   ```

Open a browser window and load URL: http://localhost:3000/.


#### Environment Variable Settings
Add the following configuration variables to the .env file.
```
SF_CONSUMER_KEY="<connected app consumer key>"
SF_PRIVATE_KEY="<private key>"
SF_AUDIENCE=https://login.salesforce.com
SF_SUBJECT=<username of Salesforce user account>
SF_AUTH_ENDPOINT=https://login.salesforce.com/services/oauth2/token
SF_PUB_SUB_ENDPOINT=api.pubsub.salesforce.com:7443
SF_PUB_SUB_TOPIC_NAME=/event/<API name of custom platform event>
SF_PUB_SUB_CUSTOM_EVENT_CHANNEL_ADDRESS_ID_FIELD=<API name of custom ChannelAddressId field>
SF_PUB_SUB_CUSTOM_EVENT_PAYLOAD_FIELD=<API name of custom Payload field>
SF_PUB_SUB_CUSTOM_EVENT_RECIPIENT_FIELD=<API name of custom Recipient field>
SF_PUB_SUB_EVENT_RECEIVE_LIMIT=100
SF_INSTANCE_URL=<Salesforce core app instance url>
SF_SCRT_INSTANCE_URL=https://<My Domain name of Salesforce org>.my.salesforce-scrt.com
SF_ORG_ID=<Salesforce orgId>
SF_AUTHORIZATION_CONTEXT=<API name of ConversationChannelDefinition record. Exclude the prefix if one exists>
CONVERSATION_ADDRESS_IDENTIFIER=<conversation address identifier>
END_USER_CLIENT_IDENTIFIER=<end user client identifier>
PORT=3000
```
## Run the Demo App
After you load URL http://localhost:3000, the Inbound/Outbound Message Demo UI appears. The UI is split into two sides with the Demo Settings section on the left side and a messaging section on the right side.

#### Demo Settings Section

The Demo Settings section of the UI includes the following required fields:
| Field      | Description |
| ----------- | ----------- |
| ConversationChannelDefinition API Name | Enter the API name (`developerName`) of the conversation channel (`ConversationChannelDefinition` entity) you want to test. For example, `ChannelDefinition1`. Exclude the prefix if one exists.|
| Conversation Address Identifier | Enter a randomly generated UUID. This represents the “To” field for inbound messaging.|
| End User Client Identifier | Enter an identifier that's less than 256 characters long to define the ID on the client side. This represents the “From” field for inbound messaging.|
| ChannelAddressIdentifier Custom Field API Name | Enter the API name of the custom ChannelAddressIdentifier field in the custom platform event. For example, `devorg__TestEvent__e. devorg__ChannelAddrId__c`.|
| Payload Custom Field API Name | Enter the API name of the custom Payload field in the custom platform event. For example, `devorg__TestEvent__e.devorg__Payload__c.`|
| Recipient Custom Field API Name | Enter the API name of the custom Recipient field in the custom platform event. For example, `devorg__TestEvent__e.devorg__Recipient__c`.|


Modify the fields value to test different custom channels, conversations, and end users. Each time you change a field value, click <b>Update</b> to apply the settings.


#### Messaging Section

The messaging section of the UI lets you send inbound test messages and file attachments to Salesforce.

To send a test message, type the message and click <b>Send</b>. To send a file attachment, click <b>Choose File</b>, select the file you want to attach, then click <b>Send</b>. Log into your Salesforce core app instance to view the inbound message in the Messaging Session record detail page.
