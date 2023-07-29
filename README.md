# BYOC Inbound/Outbound Message demo app
This interactive demo app is designed to help you test the features of inbound/outbound messaging and attachment for inbound messages after your custom channel messaging configuration is done. It also allows you to customize the settings of "Conversation Channel Definition API Name", "Conversation Address Identifier", "End User Client Identifier", "Custom Event Channel Address Id Field", "Custom Event Payload Field", and "Custom Event Recipient Field" to test different custom channels, conversations, and end users.

## Setup

```
$ git clone https://git.soma.salesforce.com/BYOC/byoc-ott-demo-app.git
$ cd byoc-ott-demo-app
$ cp .env.example .env
$ vi .env (Replace all placeholder vars marked inside <> accordingly shown as next section Configuration)
$ npm install
$ node . (Start the app server)

Then open browser and load the url: http://localhost:3000
```

## Salesforce Core Setup

- Create a [Connected App](https://git.soma.salesforce.com/service-cloud-realtime/scrt2-interaction-service/blob/master/CONNECTED_APP.md).
- In the connected app setup above, get the connected app consumer key and private key which will be set as values for keys SF_CONSUMER_KEY and SF_PRIVATE_KEY respectively in the configuration shown below.

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
After load the url: http://localhost:3000 in browser, the demo app page is displayed with two parts: "Demo Settings" on left hand side and "Messaging component" on right hand side.

In "Demo Settings" part, you can change values for fields and click the Update button to apply updated settings to test different custom channels, conversations, and end users.

In "Messaging component" part, enter a message string in the edit box, click Send button to send inbound messages. You can also click the Choose File button to select a file attached to the message. If all settings are configured properly in the Salesforce app, you should get an inbound message or message with attachment in the Messaging Session record detail page in the Salesforce app.

## Example requests
You can also use curl commands below to directly test requests for different interactionType: "EntryInteraction" and "AttachmentInteraction".

Follow instructions in [Connected App](https://git.soma.salesforce.com/service-cloud-realtime/scrt2-interaction-service/blob/master/CONNECTED_APP.md) to setup connected app and generate access token which will be used in example curl commands below.

Example request sending interaction, be sure to replace placeholder values `<..>` and `attachments` part can be optional.

- Interaction request with entryType "Message"

```bash
curl -v -H $'Authorization: Bearer <AccessToken>' -H "OrgId: <OrgId>" -H "AuthorizationContext: <AuthorizationContext>" -H "content-type:multipart/form-data" -H "RequestId: f8f81c06-c06a-4784-b96c-ca95d3321bd9" -X POST -F "json={
  \"to\": \"<ChannelAddressIdentifier>\",
  \"from\": \"<EndUserClientIdentifier>\",
  \"interactions\": [{
    \"timestamp\": 1688190840000,
    \"interactionType\": \"EntryInteraction\",
    \"payload\": {
      \"id\": \"f7904eb6-5352-4c5e-adf6-5f100572cf5d\",
      \"entryType\": \"Message\",
      \"abstractMessage\": {
        \"messageType\": \"StaticContentMessage\",
        \"id\": \"f7904eb6-5352-4c5e-adf6-5f100572cf5d\",
        \"staticContent\": {
          \"formatType\": \"Text\",
          \"text\": \"Hi there\"
        }
      }
    }
  }]
};type=application/json" http://localhost:8085/api/v1/interactions
```

- Interaction request with entryType "TypingStartedIndicator"

```bash
curl -v -H $'Authorization: Bearer <AccessToken>' -H "OrgId: <OrgId>" -H "AuthorizationContext: <AuthorizationContext>" -H "content-type:multipart/form-data"  -H "RequestId: f8f81c06-c06a-4784-b96c-ca95d3321bd9" -X POST -F "json={
  \"to\": \"<ChannelAddressIdentifier>\",
  \"from\": \"<EndUserClientIdentifier>\",
  \"interactions\": [{
    \"timestamp\": 1688190840000,
    \"interactionType\": \"EntryInteraction\",
    \"payload\": {
      \"id\": \"f7904eb6-5352-4c5e-adf6-5f100572cf5d\",
      \"entryType\": \"TypingStartedIndicator\",
      \"timestamp\": 1688190840000
    }
  }]
};type=application/json" http://localhost:8085/api/v1/interactions
```

- Interaction request with entryType "TypingStoppedIndicator"

```bash
curl -v -H $'Authorization: Bearer <AccessToken>' -H "OrgId: <OrgId>" -H "AuthorizationContext: <AuthorizationContext>" -H "content-type:multipart/form-data" -H "RequestId: f8f81c06-c06a-4784-b96c-ca95d3321bd9" -X POST -F "json={
  \"to\": \"<ChannelAddressIdentifier>\",
  \"from\": \"<EndUserClientIdentifier>\",
  \"interactions\": [{
    \"timestamp\": 1688190840000,
    \"interactionType\": \"EntryInteraction\",
    \"payload\": {
      \"id\": \"f7904eb6-5352-4c5e-adf6-5f100572cf5d\",
      \"entryType\": \"TypingStoppedIndicator\",
      \"timestamp\": 1688190840000
    }
  }]
};type=application/json" http://localhost:8085/api/v1/interactions
```

- Interaction request with entryType "MessageDeliveryFailed"

```bash
curl -v -H $'Authorization: Bearer <AccessToken>' -H "OrgId: <OrgId>" -H "AuthorizationContext: <AuthorizationContext>" -H "content-type:multipart/form-data"  -H "RequestId: f8f81c06-c06a-4784-b96c-ca95d3321bd9" -X POST -F "json={
  \"to\": \"<ChannelAddressIdentifier>\",
  \"from\": \"<EndUserClientIdentifier>\",
  \"interactions\": [{
    \"timestamp\": 1688190840000,
    \"interactionType\": \"EntryInteraction\",
    \"payload\": {
      \"id\": \"f7904eb6-5352-4c5e-adf6-5f100572cf5d\",
      \"entryType\": \"MessageDeliveryFailed\",
      \"failedConversationEntryIdentifier\": \"<FailedConversationEntryIdentifier>\",
      \"recipient\": {
         \"appType\": \"11\",
         \"subject\": \"<EndUserClientIdentifier>\",
         \"role\": \"4\"
      },
      \"errorCode\": \"<ErrorCode>\"
    }
  }]
};type=application/json" http://localhost:8085/api/v1/interactions
```

- Interaction request with file attachment

Prerequisites for getting file attachment upload working in local
- Request access with PCSKDeveloperRole to test1-uswest2 AWS account using https://dashboard.prod.aws.jit.sfdc.sh/
- The above access request should get auto-approved.
- Click on Get Credentials -> Reveal Secrets to view the AWS credentials.
- Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY & AWS_SESSION_TOKEN in your run configuration environment variables in your IDE. Use the above credential values from the previous step.
- Login into AWS console for the test1-uswest2 account and create a new S3 bucket for local use.
- In applcation.properties in your local, set interactionservice.inbound.files.bucket with the name of the S3 bucket you just created in the previous step.
- Also in application.properties, set other attachment related properties. See application.properties.example file for details.
- Please delete the bucket once local testing is complete.

```bash
curl -v -H $'Authorization: Bearer <AccessToken>' -H "OrgId: <OrgId>" -H "AuthorizationContext: <AuthorizationContext>" -H "content-type:multipart/form-data" -H "RequestId: f8f81c06-c06a-4784-b96c-ca95d3321bd9" -X POST -F "json={
  \"to\": \"<ChannelAddressIdentifier>\",
  \"from\": \"<EndUserClientIdentifier>\",
  \"interactions\": [{
    \"timestamp\": 1688190840000,
    \"interactionType\": \"AttachmentInteraction\",
    \"id\": \"g8904eb6-5352-4c5e-adf6-5f100572cf6e\",
    \"attachmentIndex\": 0,
    \"contentLength\": 10000,
    \"text\": \"This is my file\"
  }]
};type=application/json" -F "attachments=@/Users/drohra/Downloads/image.png" http://localhost:8085/api/v1/interactions
```
