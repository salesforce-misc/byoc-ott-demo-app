const express = require('express');
const multer = require('multer');
const sfdcPubSubApi = require('../sfdcLib/sfdc-pub-sub-api');
const sfdcByocApi = require('../sfdcLib/sfdc-byoc-interaction-api');
const getSfdcAccessToken = require('../sfdcLib/sfdc-auth');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const jsonParser = bodyParser.json();
const NodeCache = require( "node-cache" );

// Import dotEnv that loads the config metadata from .env
require('dotenv').config();

// Get config metadata from .env
const {
  PORT,
  SF_PUB_SUB_TOPIC_NAME,
  SF_PUB_SUB_CUSTOM_EVENT_CHANNEL_ADDRESS_ID_FIELD,
  SF_PUB_SUB_CUSTOM_EVENT_PAYLOAD_FIELD,
  SF_PUB_SUB_CUSTOM_EVENT_RECIPIENT_FIELD,
  SF_PUB_SUB_CUSTOM_EVENT_TYPE_FIELD,
  SF_ORG_ID,
  SF_AUTHORIZATION_CONTEXT,
  CHANNEL_ADDRESS_IDENTIFIER,
  END_USER_CLIENT_IDENTIFIER,
  SF_SUBJECT
} = process.env;

// cache settings in node cache
const settingsCache = new NodeCache();
settingsCache.set("authorizationContext", SF_AUTHORIZATION_CONTEXT);
settingsCache.set("channelAddressIdentifier", CHANNEL_ADDRESS_IDENTIFIER);
settingsCache.set("endUserClientIdentifier", END_USER_CLIENT_IDENTIFIER);
settingsCache.set("customEventChnlAddrIdField", SF_PUB_SUB_CUSTOM_EVENT_CHANNEL_ADDRESS_ID_FIELD);
settingsCache.set("customEventPayloadField", SF_PUB_SUB_CUSTOM_EVENT_PAYLOAD_FIELD);
settingsCache.set("customEventRecipientField", SF_PUB_SUB_CUSTOM_EVENT_RECIPIENT_FIELD);
settingsCache.set("customEventTypeField", SF_PUB_SUB_CUSTOM_EVENT_TYPE_FIELD);

const port = PORT || 3000;

// Create an Express (https://expressjs.com/) app.
const app = express();
const upload = multer({ dest: 'uploads/' });

const SLDS_DIR = '/../node_modules/@salesforce-ux/design-system/assets';
app.use('/slds', express.static(__dirname + SLDS_DIR));

const CSS_DIR = '/css';
app.use('/css', express.static(__dirname + CSS_DIR));

const SCRIPT_DIR = '/script';
app.use('/script', express.static(__dirname + SCRIPT_DIR));

const UPLOADS_DIR = '/../uploads';
app.use('/uploads', express.static(__dirname + UPLOADS_DIR));

/* ========== Endpoint definitions start. ========== */
// Register app endpoint to load index.html page
app.get('/', (_req, res) => {
  // Load index.html page
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Register sendmessage endpoint
app.post('/sendmessage', upload.single('attachment'), (req, res) => {
  const responseData = handleSendmessage(req);

  res.json(responseData);
});

// Register sendsettings endpoint
app.post('/sendsettings', jsonParser, (req, res) => {
  settingsCache.set("authorizationContext", req.body.authorizationContext);
  settingsCache.set("channelAddressIdentifier", req.body.channelAddressIdentifier);
  settingsCache.set("endUserClientIdentifier", req.body.endUserClientIdentifier);
  settingsCache.set("customEventChnlAddrIdField", req.body.customEventChnlAddrIdField);
  settingsCache.set("customEventPayloadField", req.body.customEventPayloadField);
  settingsCache.set("customEventRecipientField", req.body.customEventRecipientField);
  settingsCache.set("customEventTypeField", req.body.customEventTypeField);

  res.json('{}');
});

// Register getsettings endpoint
app.get('/getsettings', urlencodedParser, (req, res) => {
  const responseData = {
    authorizationContext: SF_AUTHORIZATION_CONTEXT,
    channelAddressIdentifier: CHANNEL_ADDRESS_IDENTIFIER,
    endUserClientIdentifier: END_USER_CLIENT_IDENTIFIER,
    customEventChnlAddrIdField: SF_PUB_SUB_CUSTOM_EVENT_CHANNEL_ADDRESS_ID_FIELD,
    customEventPayloadField: SF_PUB_SUB_CUSTOM_EVENT_PAYLOAD_FIELD,
    customEventRecipientField: SF_PUB_SUB_CUSTOM_EVENT_RECIPIENT_FIELD,
    customEventTypeField: SF_PUB_SUB_CUSTOM_EVENT_TYPE_FIELD,
    sfSubject: SF_SUBJECT
  };

  let authorizationContext = settingsCache.get("authorizationContext");
  let channelAddressIdentifier = settingsCache.get("channelAddressIdentifier");
  let endUserClientIdentifier = settingsCache.get("endUserClientIdentifier");
  let customEventChnlAddrIdField = settingsCache.get("customEventChnlAddrIdField");
  let customEventPayloadField = settingsCache.get("customEventPayloadField");
  let customEventRecipientField = settingsCache.get("customEventRecipientField");
  let customEventTypeField = settingsCache.get("customEventTypeField");

  if (authorizationContext) {
    responseData.authorizationContext = authorizationContext;
  }
  if (channelAddressIdentifier) {
    responseData.channelAddressIdentifier = channelAddressIdentifier;
  }
  if (endUserClientIdentifier) {
    responseData.endUserClientIdentifier = endUserClientIdentifier;
  }
  if (customEventChnlAddrIdField) {
    responseData.customEventChnlAddrIdField = customEventChnlAddrIdField;
  }
  if (customEventPayloadField) {
    responseData.customEventPayloadField = customEventPayloadField;
  }
  if (customEventRecipientField) {
    responseData.customEventRecipientField = customEventRecipientField;
  }
  if (customEventTypeField) {
    responseData.customEventTypeField = customEventTypeField;
  }

  res.json(responseData);
});


// Register custom event to send reply message
let repliedMessages = [];
let msgId = 1;
let sendMessageTimeoutId;

function sendMessageAtInterval(interval, res) {
  while (repliedMessages.length) {
    let msg = repliedMessages.shift();

    console.log(`\n====== reply message from message queue: `, msg);

    res.write(`event: replymsg\n`);
    res.write(`data: ${msg}\n`);
    res.write(`id: ${msgId}\n\n`);
    msgId++;
  }
  sendMessageTimeoutId = setTimeout(sendMessageAtInterval.bind(null, interval, res), interval);
}

app.get('/replyMessage', (req, res) => {
  if (sendMessageTimeoutId) {
    clearTimeout(sendMessageTimeoutId);
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  sendMessageAtInterval(100, res);
});

// Register endpoint to refresh SFDC access token
app.get('/refresh-sfdc-access-token', async (_req, res) => {
  const accessToken = await getSfdcAccessToken(true);

  res.send(accessToken);
});

app.get('/subscribe-to-interaction-event', async (_req, res) => {
  subscribeToSfInteractionEvent(sfdcPubSubClient);

  res.send('Subscribed to the Interaction event.');
});
/* ========== Endpoint definitions end. ========== */

// Event handler
function handleSendmessage(req) {
  let responseData = {};
  let interactionType = req.body.interactionType;
  let entryType = req.body.entryType;
  if (interactionType === 'AttachmentInteraction' || (interactionType === 'EntryInteraction' && entryType === 'Message')) {
    responseData = sfdcByocApi.sendSFInboundMessageInteraction(SF_ORG_ID, settingsCache.get("authorizationContext"), settingsCache.get("channelAddressIdentifier"), settingsCache.get("endUserClientIdentifier"), req);
  } else if (interactionType === 'EntryInteraction' && entryType === 'TypingStartedIndicator') {
    responseData = sfdcByocApi.sendSFInboundTypingIndicatorInteraction(SF_ORG_ID, settingsCache.get("authorizationContext"), settingsCache.get("channelAddressIdentifier"), settingsCache.get("endUserClientIdentifier"), entryType);
  }

  return responseData;
}

async function subscribeToSfInteractionEvent(sfdcPubSubClient) {
  try {
    console.log(`\n====== start subscribeToSfInteractionEvent()`);

    const subscription = sfdcPubSubApi.subscribe(sfdcPubSubClient, SF_PUB_SUB_TOPIC_NAME);
    const topicSchema = await sfdcPubSubApi.getEventSchema(sfdcPubSubClient, SF_PUB_SUB_TOPIC_NAME);
    console.log(`\n====== topicSchema: `, topicSchema);

    // Listen to new events.
    subscription.on('data', (data) => {
      if (data.events) {
        const latestReplayId = data.latestReplayId.readBigUInt64BE();
        console.log(
          `\n====== Received ${data.events.length} events, latest replay ID: ${latestReplayId}`, data.events[0].event
        );
        const parsedEvents = data.events.map((event) =>
          sfdcPubSubApi.parseEvent(topicSchema, event)
        );

        parsedEvents.forEach((event) => {
          console.log('\n====== gRPC event: ', event);

          // #1: retrieve event type
          let eventTypeField = getFieldValue(event, SF_PUB_SUB_CUSTOM_EVENT_TYPE_FIELD);
          let customEventTypeFieldFromSettings = settingsCache.get("customEventTypeField");
          console.log('\n====== customEventTypeField / customEventTypeFieldFromSettings: ', ((eventTypeField && eventTypeField.string) ? eventTypeField.string: 'null'), customEventTypeFieldFromSettings);

          let channelAddressIdFieldVal = null;
          let payloadFieldObj = null;
          let recipientFieldValObj = null;

          if (eventTypeField && eventTypeField.string) {
            console.log('\n====== customEventType found in received platform event ========');

            if (eventTypeField.string == "Interaction") {
              // #1: retrieve event payload
              let payloadField = getFieldValue(event, SF_PUB_SUB_CUSTOM_EVENT_PAYLOAD_FIELD);
              console.log('\n====== payloadField: ', payloadField);
              if (!payloadField) {
                return;
              }
              let payloadFieldVal = payloadField.string;
              console.log('\n====== payloadFieldVal: ', payloadFieldVal);
              let outerPayloadFieldObj = JSON.parse(payloadFieldVal);
              payloadFieldObj = getFieldValue(outerPayloadFieldObj, 'payload');
              console.log('\n====== messagePayload: ', payloadFieldObj);

              // #2: retrieve channel address id
              channelAddressIdFieldVal = getFieldValue(outerPayloadFieldObj, 'channelAddressIdentifier');
              if (!channelAddressIdFieldVal) {
                return;
              }

              // #3: retrieve recipient
              recipientFieldValObj = getFieldValue(outerPayloadFieldObj, 'recipient');
              if (!recipientFieldValObj) {
                return;
              }
            } else {
              console.log('\n====== Event type not supported: ', eventTypeField.string);
              return;
            }
          } else {
            //This section is to support the old schema which will be deprecated in Spring '24 and support removed in Summer '24.
            //TODO: Remove this section in 250.

            // #1: retrieve channel address id
            let channelAddressIdField = getFieldValue(event, SF_PUB_SUB_CUSTOM_EVENT_CHANNEL_ADDRESS_ID_FIELD);
            if (!channelAddressIdField) {
              return;
            }
            channelAddressIdFieldVal = channelAddressIdField.string;

            // #2: retrieve event payload
            let payloadField = getFieldValue(event, SF_PUB_SUB_CUSTOM_EVENT_PAYLOAD_FIELD);
            console.log('\n====== payloadField: ', payloadField);
            if (!payloadField) {
              return;
            }
            let payloadFieldVal = payloadField.string;
            console.log('\n====== payloadFieldVal: ', payloadFieldVal);
            payloadFieldObj = JSON.parse(payloadFieldVal);

            // #3: retrieve recipient
            let recipientField = getFieldValue(event, SF_PUB_SUB_CUSTOM_EVENT_RECIPIENT_FIELD);
            let endUserClientIdentifierFromSettings = settingsCache.get("endUserClientIdentifier");
            console.log('\n====== recipientField: ', recipientField);
            if (!recipientField || !recipientField.string) {
              return;
            }
            let recipientFieldVal = recipientField.string;
            console.log('\n====== recipientFieldVal: ', recipientFieldVal);
            recipientFieldValObj = JSON.parse(recipientFieldVal);
          }

          let channelAddressIdFromSettings = settingsCache.get("channelAddressIdentifier");
          console.log('\n====== channelAddressIdField / channelAddressIdFromSettings: ', channelAddressIdFieldVal, channelAddressIdFromSettings);

          if (!channelAddressIdFieldVal || channelAddressIdFieldVal !== channelAddressIdFromSettings) {
            return;
          }
          console.log('\n====== channelAddressIdFieldVal: ', channelAddressIdFieldVal);

          replyMessageText = getFieldValue(payloadFieldObj, 'text');
          console.log('\n====== replyMessageText: ', replyMessageText);

          let formatType = getFieldValue(payloadFieldObj, "formatType");
          let attachmentName = null;
          let attachmentUrl = null;
          if (formatType === "Attachments") {
            let attachments = getFieldValue(payloadFieldObj, 'attachments');
            if (attachments.length > 0) {
              attachmentName = getFieldValue(attachments[0], 'name');
              attachmentUrl = getFieldValue(attachments[0], 'url');
            }
          }
          console.log('\n====== attachmentName / attachmentUrl: ', attachmentName, attachmentUrl);
          
          console.log('\n====== recipientField: ', recipientFieldValObj);
          let recipientUserName = getFieldValue(recipientFieldValObj, 'subject');
          console.log('\n====== recipientUserName: ', recipientUserName);
          let endUserClientIdentifierFromSettings = settingsCache.get("endUserClientIdentifier");
         
          if (!recipientUserName || recipientUserName !== endUserClientIdentifierFromSettings) {
            return;
          }
        
          // Push stringfied reply obj
          let replyObjStr = JSON.stringify({
            channelAddressIdFieldVal,
            replyMessageText,
            attachmentName,
            attachmentUrl,
            recipientUserName
          });

          repliedMessages.push(replyObjStr);
        });
      } else {
        // If there are no events then every 270 seconds the system will keep publishing the latestReplayId.
      }
    });
    subscription.on('end', () => {
      console.log('\n====== gRPC stream ended');
    });
    subscription.on('error', (err) => {
      // TODO: Handle errors
      console.error('\n====== gRPC stream error: ', JSON.stringify(err));
    });
    subscription.on('status', (status) => {
      console.log('\n====== gRPC stream status: ', status);
    });
  } catch (err) {
    console.error('Fatal error: ', err);
  }
}

function getFieldValue(payload, fieldName) {
  for (const key in payload) {
    if (key === fieldName) {
      return payload[key];
    } else if (typeof payload[key] === 'object') {
      const result = getFieldValue(payload[key], fieldName);
      if (result !== undefined) {
        return result;
      }
    }
  }
}

app.listen(port, async () => {
  console.log(`\n====== Listening on port ${port}.`);

  let sfdcPubSubClient = await sfdcPubSubApi.connectToPubSubApi();
  subscribeToSfInteractionEvent(sfdcPubSubClient);
});
