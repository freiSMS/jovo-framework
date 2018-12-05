# Intents

In this section, you will learn more about how to use intents and states to route your users through your voice app.

* [Introduction](#introduction)
* [Standard Intents](#standard-intents)
    * [LAUNCH](#launch-intent)
    * [NEW_SESSION](#new_session-intent)
    * [NEW_USER](#new_user-intent)
    * [ON_REQUEST](#on_request-intent)
    * [END](#end-intent)
    * [Unhandled](#unhandled-intent)
* [Built-in Intents](#built-in-intents)
* [intentMap](#intentmap)

## Introduction

If you're new to voice applications, you can learn more general info about principles like intents here: [Getting Started > Voice App Basics](../../01_getting-started/voice-app-basics.md './voice-app-basics').

Besides at least one of the the required [`'LAUNCH'`](#launch-intent) or [`'NEW_SESSION'`](#new-session-intent) intents, you can add more intents that you defined at the respective developer platforms (see how to create an intent for [Amazon Alexa](https://www.jovo.tech/blog/alexa-skill-tutorial-nodejs/#helloworldintent) and [Google Assistant](https://www.jovo.tech/blog/google-action-tutorial-nodejs/#helloworldintent) in our beginner tutorials) like this:

```javascript
app.setHandler({
    LAUNCH() {
        // Triggered when people open the voice app without a specific query
        this.tell('Hello World!');
    },

    YourFirstIntent() {
      // Do something here

    },

});
```

Whenever your application gets a request from one of the voice platforms, this will either be accompanied with an intent (which you need to add), or the signal to start or end the session.

For this, Jovo offers standard, built-in intents, `'LAUNCH'` and `'END'`, to make cross-platform intent handling easier:

```javascript
app.setHandler({

    LAUNCH() {
        // Triggered when people open the voice app without a specific query
        // Groups LaunchRequest (Alexa) and Default Welcome Intent (Dialogflow)
    },

    // Add more intents here

    END() {
        // Triggered when the session ends
        // Currently supporting AMAZON.StopIntent and reprompt timeouts
    }
});
```


## Standard Intents

You can learn more about Jovo standard intents in the following sections:

* ['LAUNCH' Intent](#launch-intent)
* ['NEW_SESSION' Intent](#new_session-intent)
* ['NEW_USER' Intent](#new_user-intent)
* ['ON_REQUEST' Intent](#on_request-intent)
* ['END' Intent](#end-intent)
* ['Unhandled' Intent](#unhandled-intent)

### 'LAUNCH' Intent

The `'LAUNCH'` intent is the first one your users will be directed to when they open your voice app without a specific question (no deep invocations, just "open skill" or "talk to app" on the respective platforms). If you don't have `'NEW_SESSION'` defined, this intent is necessary to run your voice app.

```javascript
LAUNCH() {
    // Triggered when a user opens your app without a specific query
 },
```

Usually, you would need to map the requests from Alexa and Google (as they have different names) to handle both in one intent block, but Jovo helps you there with a standard intent.

### 'NEW_SESSION' Intent

You can use the `'NEW_SESSION'` intent instead of the `'LAUNCH'` intent if you want to always map new session requests to one intent. This means that any request, even deep invocations, will be mapped to the `'NEW_SESSION'` intent. Either `'LAUNCH'` or `'NEW_SESSION'`are required.

```javascript
NEW_SESSION() {
    // Always triggered when a user opens your app, no matter the query (new session)
 },
```
This is helpful if you have some work to do, like collect data (timestamps), before you route the users to the intent they wanted with the `toIntent` method.

This could look like this:

```javascript
NEW_SESSION() {
    // Do some work here

    this.toIntent(this.getIntentName());
},
```


### 'NEW_USER' Intent

Additionally to the other intents above, you can use the `'NEW_USER'` to direct a new user to this intent and do some initial work before proceeding to the interaction:

```javascript
NEW_USER() {
    // Triggered when a user opens your app for the first time
 },
```
For example, this saves you some time calling `if (this.$user.isNewUser()) { }` in every intent where you require the access to user data.

### 'ON_REQUEST' Intent

The `'ON_REQUEST'` intent can be used to map every incoming request to a single intent first. This is the first entry point for any request and does not need to redirect to any other intent. If you make any async calls in the `'ON_REQUEST'` intent, use a callback method, otherwise the intent will simply route the user to the desired intent, while the call is still running.

```javascript
ON_REQUEST() {
    // Triggered with every request
},

// Example
ON_REQUEST() {
    this.audioPlayer = this.$alexaSkill.audioPlayer();
},
```


### 'END' Intent

A session could end due to various reasons. For example, a user could call "stop," there could be an error, or a timeout could occur after you asked a question and the user didn't respond. Jovo uses the standard intent `'END'` to match those reasons for you to "clean up" (for example, to get the reason why the session ended, or save something to the database).

```javascript
END() {
    // Triggered when a session ends abrupty or with AMAZON.StopIntent
 },
```

If you want to end the session without saying anything, use the following:

```javascript
this.endSession();
```


#### getEndReason

It is helpful to find out why a session ended. Use getEndReason inside the `'END'` intent to receive more information. This currently only works for Amazon Alexa.

```javascript
END() {
    let reason = this.getEndReason();

    // For example, log
    console.log(reason);

    this.tell('Goodbye!');
 },
```


### 'Unhandled' Intent

Sometimes, an incoming intent might not be found either inside a state or among the global intents in the `handlers` variable. For this, `'Unhandled'` intents can be used to match those calls:

```javascript
Unhandled() {
    // Triggered when the requested intent could not be found in the handlers variable
 },
```

#### Global 'Unhandled' Intent

One `'Unhandled'` intent may be used outside a state to match all incoming requests that can't be found globally.

In the below example all intents that aren't found, are automatically calling the `'Unhandled'` intent, which redirects to `'LAUNCH'`:

```javascript
app.setHandler({

    LAUNCH() {
        this.tell('Hello World!');
    },

    // Add more intents here

    Unhandled() {
        this.toIntent('LAUNCH');
    }
});
```

#### State 'Unhandled' Intents

Usually, when an intent is not found inside a state, the routing jumps outside the state and looks for the intent globally.

Sometimes though, you may want to stay inside that state, and try to capture only a few intents (for example, a yes-no-answer). For this, `'Unhandled'` intents can also be added to states.

See this example:

```javascript
app.setHandler({

    LAUNCH() {
        let speech = 'Do you want to play a game?';
        let reprompt = 'Please answer with yes or no.';
        this.followUpState('PlayGameState')
            .ask(speech, reprompt);
    },

    'PlayGameState': {
        YesIntent() {
            // Do something
        },

        NoIntent() {
            // Do something
        },

        Unhandled() {
            let speech = 'You need to answer with yes, to play a game.';
            let reprompt = 'Please answer with yes or no.';
            this.ask(speech, reprompt);
        },
    },

    // Add more intents here

});
```

This helps you to make sure that certain steps are really taken in the user flow.

However, for some intents (for example, a `'CancelIntent'`), it might make sense to always route to a global intent instead of `'Unhandled'`. This can be done with [intentsToSkipUnhandled](#intentsToSkipUnhandled).


#### intentsToSkipUnhandled

With `intentsToSkipUnhandled`, you can define intents that aren't matched to an `'Unhandled'` intent, if not found in a state. This way, you can make sure that they are always captured globally.

```javascript
let myIntentsToSkipUnhandled = [
    'CancelIntent',
    'HelpIntent',
];

// Use constructor
const config = {
    intentsToSkipUnhandled: myIntentsToSkipUnhandled,
    // Other configurations
};

// Use the setter
app.setIntentsToSkipUnhandled(myIntentsToSkipUnhandled);
```

In the below example, if a person answers to the first question with "Help," it is not going to `'Unhandled'`, but to the global `'HelpIntent'`:

```javascript
app.setHandler({

    LAUNCH() {
        let speech = 'Do you want to play a game?';
        let reprompt = 'Please answer with yes or no.';
        this.followUpState('PlayGameState')
            .ask(speech, reprompt);
    },

    'PlayGameState': {
        YesIntent() {
            // Do something
        },

        NoIntent() {
            // Do something
        },

        Unhandled() {
            let speech = 'You need to answer with yes, to play a game.';
            let reprompt = 'Please answer with yes or no.';
            this.ask(speech, reprompt);
        },
    },

    HelpIntent() {
        // Do something
    },

    // Add more intents here

});
```

## Built-in Intents

As mentioned above, the platforms offer different types of built-in intents.

* Amazon Alexa: [Standard built-in intents](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/built-in-intent-ref/standard-intents)
* Google Assistant: [Built-in Intents (Developer Preview)](https://developers.google.com/actions/discovery/built-in-intents)


## intentMap

In cases where the names of certain intents differ across platforms, Jovo offers a simple mapping function for intents. You can add this to the configuration section of your voice app:

```javascript
let myIntentMap = {
    'incomingIntentName' : 'mappedIntentName'
};

// Use constructor
const config = {
    intentMap: myIntentMap,
    // Other configurations
};

// Use setter
app.setIntentMap(myIntentMap);
```

This is useful especially for platform-specific, built-in intents. One example could be Amazon's standard intent when users ask for help: `AMAZON.HelpIntent`. You could create a similar intent on Dialogflow called `HelpIntent` and then do the matching with the Jovo `intentMap`.

```javascript
let intentMap = {
    'AMAZON.HelpIntent' : 'HelpIntent'
};
```

This can also be used if you have different naming conventions on both platforms and want to match both intents to a new name. In the below example, the `AMAZON.HelpIntent` and an intent called `help-intent` on Dialogflow are matched to a Jovo intent called `HelpIntent`.

```javascript
let intentMap = {
    'AMAZON.HelpIntent' : 'HelpIntent',
    'help-intent' : 'HelpIntent'
};
```




<!--[metadata]: { "description": "Learn more about how to use intents with the Jovo Framework.",
		"route": "routing/intents"
                }-->